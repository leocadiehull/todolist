//jshint esversion:6

// import libraries
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const { response } = require("express");
const day = date.getDate();
const _ = require("lodash");
require('dotenv').config();

// turn libraries into usuable objects
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// define databases
mongoose.set('strictQuery', false);
const url = process.env.MONGOOSURL;

mongoose.connect(url);

const itemSchema = {
  name: String
};
const listSchema = {
  name: String,
  items: [itemSchema]
};

const Item = mongoose.model("Item",itemSchema);
const defaultItems = [
  {name: "Welcome to your Todo List!"}, 
  {name: "Hit the + button to add a new list item."},
  {name: "<-- Hit this to delete an item."}
];

const List = mongoose.model("List", listSchema);

// Define routes and page behaviors
app.get("/", function(req, res) {

  Item.find({}, (err, foundItems) => {

    if(foundItems.length === 0){

      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Insert successful!");
        }
      });

      res.redirect("/");

    } else {
      res.render("list", {listTitle: day, newListItems: foundItems});
    }

  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const itemDoc = new Item(
    {
      name: itemName
    });

  if(listName === day) {
    itemDoc.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(itemDoc);
      foundList.save();
      res.redirect(`/${listName}`);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === day) {
    Item.findByIdAndRemove(checkedItemId, (err, foundItem) => {
      if(!err) {
        console.log(`${checkedItemId} has been deleted.`);
        res.redirect(`/`);
      } else {
        console.log(err);
      }
    });
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemId}}},
      (err, foundList) => {
        if(!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, (err, foundList) => {
    if(foundList) {
      //Show list
      const displayTitle = _.capitalize(foundList.name);
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
    } else {

      //Create New List
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect(`/${customListName}`);
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

//Establish the server the app will run on
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
