const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");

const isMatch = require("date-fns/isMatch");

var isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const convertDataIntoResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

// API - 1
app.get("/todos/", async (request, response) => {
  const {
    search_q = "",
    priority = "",
    status = "",
    category = "",
  } = request.query;
  let data = null;
  let getTodosQuery = "";

  // WE ARE USING SWITCH CASES FOR BECAUSE OF DIFFERENT SCENARIOS
  switch (true) {
    // Scenario - 1 Has Only Status
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(getTodoQuery);
        response.send(
          data.map((eachItem) => convertDataIntoResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // Scenario - 2 Has Only Priority
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachItem) => convertDataIntoResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // Scenario - 3 Has Both Priority and Status
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachTIme) => convertDataIntoResponseObject(eachTIme))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // Scenario - 4 Has Only search_q
    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(
        data.map((eachItem) => convertDataIntoResponseObject(eachItem))
      );
      break;

    // Scenario - 5 Has Both Category and Status
    case hasCategoryAndStatusProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachItem) => convertDataIntoResponseObject(eachItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // Scenario - 6 Has only category
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category = '${category}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachItem) => convertDataIntoResponseObject(eachItem))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // Scenario - 7 Has both Category and Priority
    case hasCategoryAndPriorityProperties(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachItem) => convertDataIntoResponseObject(eachItem))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
  }
});

// GET API 2 Returns a specific todo based on the todo ID

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoIdQuery = `SELECT * FROM todo WHERE todo.id = ${todoId};`;
  const queryResponse = await db.get(todoIdQuery);
  response.send(convertDataIntoResponseObject(queryResponse));
});

// GET API 3 Returns a list of all todos with a specific due date in the query parameter
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  //console.log(date);
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    //console.log(newDate);
    const getDateQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const dbResponse = await db.all(getDateQuery);
    //console.log(dbResponse);
    response.send(
      dbResponse.map((eachItem) => convertDataIntoResponseObject(eachItem))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API - 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postQuery = `INSERT INTO todo(id, todo, priority, status, category, due_date) VALUES (${id}, '${todo}', '${priority}', '${status}', '${category}', '${newDueDate}');`;
          await db.run(postQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

// API - 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  //console.log(previousTodo);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;
  let updateTodo;

  // We are Switch case because scenarios are given.
  switch (true) {
    //Updating Status
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodo = `UPDATE TODO SET status = '${status}' WHERE id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // Updating Priority
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodo = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // Updating Todo
    case requestBody.todo !== undefined:
      updateTodo = `UPDATE TODO SET todo = '${todo}' WHERE id = ${todoId};`;
      await db.run(updateTodo);
      response.send("Todo Updated");
      break;

    // Updating Category
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodo = `UPDATE todo SET category = '${category}' WHERE id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // Updating Due Date
    case requestBody.dueDate !== undefined:
      //console.log(dueDate);
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        console.log(newDueDate);
        updateTodo = `UPDATE todo SET due_date = '${newDueDate}' WHERE id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

// API - 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
