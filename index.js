const express = require("express");
const cors = require("cors");
require("dotenv").config()
const app = express();
const port = 3000;

const admin = require("firebase-admin");

const serviceAccount = require("./serviceKey.json");

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri =
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.o2qxabl.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyFirebaseToken = async (req, res, next) => {
  const authorizeData = req.headers.authorization;

  if (!authorizeData) {
    res.status(401).send({
      message: "unauthorize access",
    });
  }
  const token = authorizeData.split(" ")[1];

  try {
    // const decode =
    await admin.auth().verifyIdToken(token);
    // console.log(decode)
    next();
  } catch (error) {
    res.status(401).send({
      message: "unauthorize access",
    });
  }
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const db = client.db("intertrade");
    const allProductsCollection = db.collection("allProducts");
    const serviceCollection = db.collection("service");
    const chooseUSCollection = db.collection('ChooseUS')
    const importsCollection = db.collection("import");

    app.get("/all-products", async (req, res) => {
      const result = await allProductsCollection.find().toArray();
      // console.log(result)
      res.send(result);
    });

     app.get("/service", async (req, res) => {
      const result = await serviceCollection.find().toArray();
      // console.log(result)
      res.send(result);
    });

     app.get("/choose", async (req, res) => {
      const result = await chooseUSCollection.find().toArray();
      // console.log(result)
      res.send(result);
    });
    

    app.get("/latest-products", async (req, res) => {
      const result = await allProductsCollection
        .find()
        .sort({createdAt:-1})
        .limit(3)
        .toArray();
      // console.log(result);
      res.send(result);
    });

    app.get("/my-imports", verifyFirebaseToken, async (req, res) => {
      const email = req.query.email;
      const result = await importsCollection
        .find({ importedBy: email })
        .toArray();
      res.send(result);
    });

     app.get("/my-exports", verifyFirebaseToken, async (req, res) => {
      const email = req.query.email;
      const result = await allProductsCollection
        .find({ exportedBy: email })
        .toArray();
      res.send(result);
    });


    app.get("/all-products/:id", verifyFirebaseToken, async (req, res) => {
      const { id } = req.params;
      const result = await allProductsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

     app.get('/all-product/:id',verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const result = await allProductsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
  });


    app.post("/import", async (req, res) => {
      const data = req.body;
      const result = await importsCollection.insertOne(data);
      res.send(result);
    });

    app.post('/add-export', async(req,res)=>{
      const data = req.body;
      const result = await allProductsCollection.insertOne(data);
      res.send(result)
    })

    app.put("/import/:id", async (req, res) => {
      const { id } = req.params;
      const { availableQuantity } = req.body;
      const objectId = new ObjectId(id);

      const filter = { _id: objectId };
      const updateData = {
        $set: { availableQuantity },
      };

      const result = await allProductsCollection.updateOne(filter, updateData);
      res.send(result);
    });

     app.put("/my-export-update/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      //   console.log(id);
      //   console.log(data);
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };
      const updateData = {
        $set: data,
      };
      const result = await allProductsCollection.updateOne(filter, updateData);

      res.send(result);
    });

    app.delete('/import-product/:id', async(req,res)=>{
      const id = req.params 
      const result = await importsCollection.deleteOne({
        _id : new ObjectId(id)
      })
      res.send(result)
    })

    app.delete('/my-export/:id', async(req,res)=>{
      const id = req.params
      const result = await allProductsCollection.deleteOne({
        _id : new ObjectId(id)
      })
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
  res.send(" we are coming from backend");
});

app.listen(port, () => {
  console.log("server is running on port 3000");
});
