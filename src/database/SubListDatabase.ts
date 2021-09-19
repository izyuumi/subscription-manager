import { addPouchPlugin, getRxStoragePouch, addRxPlugin } from "rxdb";
import { createRxDatabase } from "rxdb/plugins/core";
import { RxDBLeaderElectionPlugin } from "rxdb/plugins/leader-election";
import { RxDBReplicationCouchDBPlugin } from "rxdb/plugins/replication-couchdb";
import { RxDBNoValidatePlugin } from "rxdb/plugins/no-validate";
addPouchPlugin(require("pouchdb-adapter-idb"));
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBReplicationCouchDBPlugin);
addRxPlugin(RxDBNoValidatePlugin);

const subListSchema = {
  title: "subscription list schema",
  version: 0,
  description: "list of subscriptions on main page",
  primaryKey: "subId",
  type: "object",
  properties: {
    subId: {
      type: "string",
    },
    icon: {
      type: "string",
    },
    name: {
      type: "string",
    },
    startDate: {
      type: "string",
    },
    period: {
      type: "string",
    },
    nextDate: {
      type: "string",
    },
    url: {
      type: "string",
    },
    note: {
      type: "string",
    },
    notify: {
      type: "boolean",
    },
    notificationId: {
      type: "string",
    },
    createdOn: {
      type: "string",
    },
  },
  required: ["subId", "name", "startDate", "period"],
};

let dbPromise: any = null;

const _create = async () => {
  console.log("DatabaseService: creating database");
  const db = await createRxDatabase({
    name: "sub",
    storage: getRxStoragePouch("idb"),
    multiInstance: false,
    ignoreDuplicate: true,
  }).then((db) => {
    console.log("DatabaseService: created database");
    return db;
  });

  await db.waitForLeadership().then(() => {
    console.log("isLeader now");
  });

  console.log("DatabaseService: creating collections");
  await db.addCollections({
    sublist: {
      schema: subListSchema,
    },
  });
  console.log("DatabaseService: created collection");

  return db;
};

export const get = () => {
  if (!dbPromise) dbPromise = _create();
  return dbPromise;
};
