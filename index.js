const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// requeire jwt token
const jwt = require("jsonwebtoken");
//middleware configuration
app.use(express.json());
app.use(cors());

// jwt token middleware configuration
  const verify_jwt = (req,res,next)=>{
    const authorization = req.headers.authorization;
    if(!authorization){
      return res.status(401).send({error:true, message: " unauthorized access"});
    }
    //bearer token
    const token = authorization.split(' ')[1];
    jwt.verify(token,process.env.Access_JWT_Token,(err,decoded)=>{
      if(err){
        return res.status(401).send({error:true, message: " unauthorized access"});
      }
      req.decoded = decoded;
      next()
    })
  }
//mondodb connection here
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.MongoDB_User}:${process.env.MongoDB_Password}@cluster0.inzz8jh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    //all database connection here
    const userCollection = client.db("Artistry").collection("user");
    const courseCollection = client.db("Artistry").collection("course");
    const testimonialCollection = client
      .db("Artistry")
      .collection("testimonial");
    const selectededCourseCollection = client
      .db("Artistry")
      .collection("selectededCourse");

    //jwt token create
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.Access_JWT_Token, {
        expiresIn: "1h",
      });
      res.send(token);
    });

    app.put("/user/:email", async (req, res) => {
      const userEmail = req.params.email;
      const userInfo = req.body;
      const query = { email: userEmail };
      const options = { upsert: true };
      const updateDoc = {
        $set: userInfo,
      };
      const result = await userCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });
    //get allusers from usercollection
    app.get("/allUsers",async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // get isAdmin for usercolletion
    app.get("/isAdmin/:email",async (req, res) => {
      const userEmail = req.params.email;
      const query = { email: userEmail };
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });
    // get isInstructor for usercolletion
    app.get("/isInstructor/:email", async (req, res) => {
      const userEmail = req.params.email;
      const query = { email: userEmail };
      const user = await userCollection.findOne(query);
      const result = { instructor: user?.role === "instructor" };
      res.send(result);
    });

    //admin related all api here
    /** make a admin */
    app.patch("/makeAdmin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    /** make a instructor */
    app.patch("/makeInstructor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    app.patch("/courseApproved/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await courseCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    app.post("/courseDeny/:id", async (req, res) => {
      const id = req.params.id;
      const feedback = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "deny",
          feedback: feedback.message,
        },
      };
      const result = await courseCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    /** Instructor Related Api Work here */
    app.post("/addedCourse", async (req, res) => {
      const courseInfo = req.body;
      const result = await courseCollection.insertOne(courseInfo);
      res.send(result);
    });
    app.get("/getInstructorCourse/:email", async (req, res) => {
      const email = req.params.email;
      const query = { instructorEmail: email };
      const result = await courseCollection.find(query).toArray();
      res.send(result);
    });
    app.put("/updateCourse/:id", async (req, res) => {
      const updateCourseId = req.params.id;
      const updateCourseInfo = req.body;
      const query = { _id: new ObjectId(updateCourseId) };
      const updateDoc = {
        $set: updateCourseInfo,
      };
      const result = await courseCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    app.delete("/deleteCourse/:id", async (req, res) => {
      const deleteId = req.params.id;
      const query = { _id: new ObjectId(deleteId) };
      const result = courseCollection.deleteOne(query);
      res.send(result);
    });
    /** Student related Apik work here */
    app.post("/addToCart", async (req, res) => {
      const selectededCourseInfo = req.body;
      const result = await selectededCourseCollection.insertOne(
        selectededCourseInfo
      );
      res.send(result);
    });
    app.get("/getAddToCartCourse/:email", verify_jwt, async (req, res) => {
      const userEmail = req.params.email;
      const decodedEmail = req.decoded.email;
      const query = { userEmail: userEmail };
      const result = await selectededCourseCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/deleteAddToCartCourse/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectededCourseCollection.deleteOne(query);
      res.send(result);
    });
    app.patch("/instructor/:email", async (req, res) => {
      const userEmail = req.params.email;
      const query = { email: userEmail };
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });
    app.get("/allCourse",async (req, res) => {
      const result = await courseCollection.find().toArray();
      res.send(result);
    });
    app.get("/singleCourse/:id", async (req, res) => {
      const singleCourseId = req.params.id;
      const query = { _id: new ObjectId(singleCourseId) };
      const result = await courseCollection.findOne(query);
      res.send(result);
    });
    app.get('/allCourse/:email', async (req, res) => {
      const userEmail = req.params.email;
      const query = { instructorEmail : userEmail };
      const result = await courseCollection.find(query).toArray();
      res.send(result);
    })
    app.get("/allInstructor",async (req, res) => {
      const instructors = await userCollection.find().toArray();
      const result = instructors.filter(
        (instructor) => instructor?.role === "instructor"
      );
      res.send(result);
    });
    app.get('/singleInstructor/:id', async (req, res) => {
      const userId = req.params.id;
      const query = { _id: new ObjectId(userId) };
      const result = await userCollection.findOne(query);
      res.send(result)
    })
    app.get("/allTestimonial", async (req, res) => {
      const result = await testimonialCollection.find().toArray();
      res.send(result);
    });
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
  res.send(`Welcome to our application`);
});
app.listen(port, () => {
  console.log(`server listening on ${port}`);
});
