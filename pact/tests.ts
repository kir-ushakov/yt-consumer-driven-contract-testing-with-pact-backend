import { Verifier } from "@pact-foundation/pact";
import mongoose from "mongoose";
import { version } from "../package.json";
import { UserDocument } from "../src/shared/infra/database/mongodb/user.model";
import { models } from "../src/shared/infra/database/mongodb";
import Task from "../src/shared/infra/database/mongodb/task.model";
import * as loaders from "../src/loaders";
import VerificationTokenModel, { VerificationTokenDocumnet } from "../src/shared/infra/database/mongodb/verification-token.model";
import { authenticatedUser } from "./authenticated-user";

loaders.bootstrap("Pact Test Script");

async function cleanDb() {
  try {
    await models.UserModel.deleteMany({});
    await models.ClientModel.deleteMany({});
    await models.TaskModel.deleteMany({});
    await VerificationTokenModel.deleteMany({});
  } catch (error) {
    console.log("DB clearing failed");
    console.log(error);
  }
}

const TEST_CLIENT_ID = "63204391a3781200348d45a9";

async function createAuthenticatedUser(): Promise<UserDocument> {
  const user = new models.UserModel({
    _id: authenticatedUser._id,
    username: authenticatedUser.username,
    firstName: authenticatedUser.firstName,
    lastName: authenticatedUser.lastName,
    verified: authenticatedUser.verified,
  });
  return await user.save();
}

const opts = {
  providerBaseUrl: `https://backend-test:${process.env.PORT}`,
  pactBrokerUrl: process.env.PACT_BROKER_URL,
  pactBrokerToken: process.env.PACT_BROKER_TOKEN,
  provider: "baApi",
  consumerVersionTags: ["latest"],
  publishVerificationResult: true,
  providerVersion: version,
  validateSSL: false,
  beforeEach: async() => {
    try {
      await cleanDb();
    } catch(err) {
      console.log("Failed to clean DB");
    }
  },
  stateHandlers: {
    "has authorized user without clientIds": async () => {
      try {
        await createAuthenticatedUser();
      } catch (error) {
        console.log("added User without ClientId failed");
      }
    },
    "has changes relative to the client": async() => {
      try {
        const authenticatedUser: UserDocument = await createAuthenticatedUser();
        await new models.ClientModel({ userId: authenticatedUser._id, clientId: TEST_CLIENT_ID }).save();
        await new Task({
          _id: mongoose.Types.ObjectId().toHexString(),
          userId: authenticatedUser._id,
          type: "TASK_TYPE_BASIC",
          title: "Task Title",
          status: "TODO",
          createdAt: new Date(2021, 1, 1),
          modifiedAt: new Date(2021, 1, 2),
        }).save();
        await new Task({
          _id: mongoose.Types.ObjectId().toHexString(),
          userId: authenticatedUser._id,
          type: "TASK_TYPE_BASIC",
          title: "Task Title 2",
          status: "TODO",
          createdAt: new Date(2021, 1, 3),
          modifiedAt: new Date(2021, 1, 3),
        }).save();
      } catch (error) {
        console.log("added user with two tasks failed");
      }
    },
    "has no tasks": async () => {
      try {
        await createAuthenticatedUser();
      } catch (error) {
        console.log("added User without tasks failed");
      }
    },
    "there is a not logged in user with username=test@mail.com and password=password": async () => {
      try {
        const user: UserDocument = new models.UserModel({
          username: "test@mail.com",
          firstName: "firstName",
          lastName: "lastName",
          verified: true,
        });
        await user.setPassword("password");
        await user.save();
      } catch (error) {
        console.log("adding not loggedIn User failed");
      }
    },
    "has not verified user with username=test@mail.com": async () => {
      try {
        // add user
        const user: UserDocument = new models.UserModel({
          username: "test@mail.com",
          firstName: "firstName",
          lastName: "lastName",
          verified: false,
        });
        await user.setPassword("password");
        await user.save();

        // add token
        const token: VerificationTokenDocumnet = new VerificationTokenModel({
          userId: user._id,
          token: "token_123!&#",
          createdAt: new Date(),
        });
        await token.save();
      } catch (error) {
        console.log("Adding a not verified user with email 'test@mail.com' failed");
      }
    },
    "has one task with id=4a69d555-756e-4805-8dbf-007c8dffb645": async() => {
      const authenticatedUser: UserDocument = await createAuthenticatedUser();
      await new models.ClientModel({ userId: authenticatedUser._id, clientId: TEST_CLIENT_ID }).save();
      await new Task({
        _id: "4a69d555-756e-4805-8dbf-007c8dffb645",
        userId: authenticatedUser._id, 
        type: "TASK_TYPE_BASIC",
        title: "Task Title",
        status: "TODO",
        createdAt: new Date(2021, 1, 1),
        modifiedAt: new Date(2021, 1, 2),
      }).save();
    }
  }
};

try {
  new Verifier(opts).verifyProvider().then(async () => {
    console.log("Pacts successfully verified!");
    await cleanDb();
  }).catch(async() => {
    console.log("Pacts weren't verified successfully :(");
    await cleanDb();
  });
} catch (error) {
  console.log("Error occurred during Pacts verification!");
  console.log(error);
}
