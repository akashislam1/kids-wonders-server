const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
// middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jhmca2y.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const toyCollections = client.db("toyShopDB").collection("toyCollection");

    // create index for search
    const indexKey = { toy_name: 1 };
    const indexOptions = { name: "toy_name" };
    const result = await toyCollections.createIndex(indexKey, indexOptions);

    // get all toy collections
    app.get("/toys", async (req, res) => {
      const result = await toyCollections.find().limit(20).toArray();
      res.send(result);
    });
    // get toy by sub category
    app.get("/toys/:sub-category", async (req, res) => {
      let query = {};
      if (req.query?.subCategory) {
        query = { subCategory: req.query?.subCategory };
      }
      const result = await toyCollections.find(query).toArray();
      res.send(result);
    });
    // get toy by id
    app.get("/toys/:id", async (req, res) => {
      const result = await toyCollections.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });
    // get toy by email
    app.get("/mytoys/:email", async (req, res) => {
      const result = await toyCollections
        .find({ seller_email: req.params.email })
        .sort({ price: 1 })
        .toArray();
      res.send(result);
    });
    // get toy by search

    app.get("/searchToy/:text", async (req, res) => {
      const searchText = req.params.text;
      const result = await toyCollections
        .find({
          $or: [
            {
              toy_name: { $regex: searchText, $options: "i" },
            },
          ],
        })
        .toArray();
      res.send(result);
    });

    // post method
    app.post("/post-toy", async (req, res) => {
      const result = await toyCollections.insertOne(req.body);
      res.send(result);
    });
    // patch method
    app.patch("/update-toy/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const updateDoc = {
        $set: {
          price: req.body.price,
          available_quantity: req.body.available_quantity,
          detail_description: req.body.detail_description,
        },
      };
      const result = await toyCollections.updateOne(filter, updateDoc);
      res.send(result);
    });

    // delete method
    app.delete("/post-toy/:id", async (req, res) => {
      const result = await toyCollections.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Toy server is running");
});
app.listen(port, () => {
  console.log("Toy server is listening on port " + port);
});
