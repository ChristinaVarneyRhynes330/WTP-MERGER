import test from "node:test"
import assert from "node:assert/strict"
import { handoffBridge } from "../src/handoff-module/connection.ts"

const matterA = "10000000-0000-4000-8000-000000000001"
const matterB = "20000000-0000-4000-8000-000000000002"

test("counsel bridge is disconnected for any matter until a server-approved adapter exists", async () => {
  for (const matterId of [matterA, matterB]) {
    const state = await handoffBridge.getConnection(matterId)
    assert.equal(state.matterId, matterId)
    assert.equal(state.status, "disconnected")
    assert.deepEqual(state.authorizedObjectIds, [])
    assert.match(state.reason, /backend/)
  }
})

test("disconnected bridge returns no object records, filenames or AI context", async () => {
  assert.deepEqual(await handoffBridge.listGrantedObjects(matterA), [])
  assert.deepEqual(await handoffBridge.listGrantedObjects(matterB), [])
})
