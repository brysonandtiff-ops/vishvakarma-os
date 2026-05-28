#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required Supabase environment variables. Please provide SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

function isExistingUserError(error) {
  const message = error?.message?.toLowerCase() ?? '';
  return message.includes('already') || message.includes('registered') || error?.status === 422;
}

async function setup() {
  const email = 'admin@miaoda.com';
  const password = 'A1!' + crypto.randomBytes(12).toString('base64').slice(0, 14) + 'z#';

  console.log(`Creating admin account: ${email}`);

  let userId;
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (!isExistingUserError(createError)) {
      console.error('Error creating user:', createError.message);
      process.exit(1);
    }

    const existingUser = await findUserByEmail(email);
    if (!existingUser) {
      console.error('Existing user reported but could not be resolved by email.');
      process.exit(1);
    }

    userId = existingUser.id;
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });

    if (updateError) {
      console.error('Error updating existing admin user:', updateError.message);
      process.exit(1);
    }
  } else {
    userId = createData.user?.id;
    if (!userId) {
      console.error('Create user succeeded but returned no user id.');
      process.exit(1);
    }
  }

  const { error: profileError } = await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', userId);
  if (profileError) {
    console.error('Error promoting profile to admin:', profileError.message);
    process.exit(1);
  }

  console.log('Admin setup complete.');
  console.log('--- CREDENTIALS ---');
  console.log(`Username (Email): ${email}`);
  console.log(`Password: ${password}`);
}

setup().catch((error) => {
  console.error('Admin setup failed:', error.message);
  process.exit(1);
});
