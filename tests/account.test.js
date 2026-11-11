"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const account = fs.readFileSync(path.join(root, "js/account.js"), "utf8");
const config = fs.readFileSync(path.join(root, "js/supabase-config.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
function check(ok, label) {
  if (!ok) { console.error("FAIL " + label); process.exitCode = 1; }
  else console.log("ok   " + label);
}
check(account.includes("signInWithPassword") && account.includes("signUp"), "account supports sign-in and self-registration");
check(account.includes("resetPasswordForEmail") && account.includes("updateUser"), "account supports password recovery and reset");
check(account.includes("onAuthStateChange") && account.includes("SIGNED_IN"), "account responds to confirmation and invitation sessions");
check(account.includes("it: {") && account.includes("en: {"), "account interface has Italian and English text");
check(config.includes('url: ""') && config.includes('anonKey: ""'), "Supabase config is safe and disabled by default");
check(!config.includes("service_role") && !account.includes("SUPABASE_SERVICE_ROLE_KEY"), "browser account code contains no service-role secret");
check(html.indexOf("supabase-js") < html.indexOf("js/account.js"), "Supabase client loads before account interface");
