import test from 'node:test';
import assert from 'node:assert/strict';
import { uploadConfiguration, uploadFailure } from '../lib/uploadConfiguration.mjs';
const url = 'https://example-project.supabase.co';
const jwt = payload => `fixture.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.fixture-signature`;

test('upload configuration rejects public, malformed and wrong-project keys without disclosure', () => {
  const config = key => uploadConfiguration({ NEXT_PUBLIC_SUPABASE_URL:url, SUPABASE_SERVICE_ROLE_KEY:key });
  assert.equal(config('').code, 'UPLOAD_KEY_MISSING');
  assert.equal(config('sb_publishable_fixture').code, 'UPLOAD_KEY_PUBLIC');
  assert.equal(config(jwt({ role:'anon', ref:'example-project' })).code, 'UPLOAD_KEY_PUBLIC');
  assert.equal(config(jwt({ role:'service_role', ref:'another-project' })).code, 'UPLOAD_KEY_PROJECT');
  assert.equal(config('random-session-secret-not-a-supabase-key').code, 'UPLOAD_KEY_FORMAT');
  for (const key of ['sb_publishable_fixture', jwt({ role:'service_role', ref:'another-project' })]) {
    assert.equal(JSON.stringify(config(key)).includes(key), false);
  }
});

test('upload config supports matching legacy and current server keys and trims copied whitespace', () => {
  const key = jwt({ role:'service_role', ref:'example-project' });
  assert.deepEqual(uploadConfiguration({ NEXT_PUBLIC_SUPABASE_URL:url, SUPABASE_SERVICE_ROLE_KEY:` ${key}\n` }), {url,key});
  assert.deepEqual(uploadConfiguration({ NEXT_PUBLIC_SUPABASE_URL:url, SUPABASE_SECRET_KEY:' sb_secret_fixture\n' }), {url,key:'sb_secret_fixture'});
});

test('upstream failures produce actionable safe messages without echoing raw errors', () => {
  const secret = 'must-never-be-echoed';
  assert.equal(uploadFailure({status:401,message:secret}).code, 'UPLOAD_KEY_REJECTED');
  assert.equal(uploadFailure({code:'NoSuchBucket',message:secret}).code, 'UPLOAD_BUCKET_MISSING');
  assert.equal(uploadFailure({status:403,message:secret}).code, 'UPLOAD_ACCESS_DENIED');
  assert.equal(uploadFailure({message:'fetch failed '+secret}).code, 'UPLOAD_CONNECTION_FAILED');
  assert.equal(uploadFailure({status:500,message:secret}).code, 'UPLOAD_PREPARE_FAILED');
  assert.equal(JSON.stringify(uploadFailure({status:500,message:secret})).includes(secret), false);
});
