"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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
check(account.includes('window.dispatchEvent(new CustomEvent("pog:authchange"') && account.includes('localStorage.setItem("pog_account_signed_out", "1")'), "sign-in and sign-out state is shared with the main app and persists across refreshes");
check(account.includes("it: {") && account.includes("en: {"), "account interface has Italian and English text");
check((config.includes('url: ""') && config.includes('anonKey: ""')) || (/url: "https:\/\/[^\"]+\.supabase\.co"/.test(config) && /anonKey: "[^\"]+"/.test(config) && !config.includes("service_role")), "Supabase config is either disabled or uses a public project URL and anon key");
check(!config.includes("service_role") && !account.includes("SUPABASE_SERVICE_ROLE_KEY"), "browser account code contains no service-role secret");
check(html.indexOf("supabase-js") < html.indexOf("js/account.js"), "Supabase client loads before account interface");
const sdkTag = (html.match(/<script[^>]*supabase-js[^>]*>/) || [""])[0];
const sdkPath = path.join(root, "js/vendor/supabase-js-2.119.0.js");
const sdkHash = crypto.createHash("sha384").update(fs.readFileSync(sdkPath)).digest("base64");
check(sdkTag.includes('src="js/vendor/supabase-js-2.119.0.js"') && !sdkTag.includes("https://"), "browser Supabase SDK is served from the app");
check(sdkTag.includes('integrity="sha384-' + sdkHash + '"') && sdkHash === "uteMfOloLDGt042uDz+xHGF3ym63/WQ6rFq7murQRG8Ih7QrXGEGNtWd8688sb4O", "locally served SDK matches its pinned subresource integrity hash");
check(fs.readFileSync(path.join(root, "js/vendor/LICENSE.supabase-js.txt"), "utf8").includes("MIT License"), "Supabase SDK license is included with the vendored asset");
check(!/cdn\.jsdelivr\.net/.test(html), "page does not request the SDK from a third-party CDN");
