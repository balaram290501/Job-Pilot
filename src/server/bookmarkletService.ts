import { adminDb } from '../lib/serverFirebase.js';
import { UserDoc, CandidateProfile } from '../types.js';

/**
 * Generate a secure random API token for user
 */
export function generatePersonalToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'jp_tok_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Find user document by personal API token
 */
export async function getUserByApiToken(token: string): Promise<UserDoc | null> {
  if (!token) return null;
  const snapshot = await adminDb.collection('users')
    .where('apiToken', '==', token)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { uid: doc.id, ...doc.data() } as UserDoc;
}

/**
 * Generate Bookmarklet A: Save Job to JobPilot
 */
export function generateSaveJobBookmarkletScript(userToken: string, appHostUrl: string): string {
  const script = `(function(){
  try {
    var token = "${userToken}";
    var appUrl = "${appHostUrl}";

    var title = "";
    var company = "";
    var jd = "";
    var source = "other";

    var url = window.location.href;
    if (url.indexOf("linkedin.com") !== -1) {
      source = "linkedin";
      var tEl = document.querySelector(".job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1");
      if (tEl) title = tEl.innerText.trim();
      var cEl = document.querySelector(".job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name");
      if (cEl) company = cEl.innerText.trim();
      var jdEl = document.querySelector("#job-details, .jobs-description__content, .jobs-box__html-content");
      if (jdEl) jd = jdEl.innerText.trim();
    } else if (url.indexOf("naukri.com") !== -1) {
      source = "naukri";
      var tEl2 = document.querySelector("h1.jd-header-title, .styles_jd-header-title__head__33x7n");
      if (tEl2) title = tEl2.innerText.trim();
      var cEl2 = document.querySelector(".jd-header-comp-name, .styles_jd-header-comp-name__A21b1");
      if (cEl2) company = cEl2.innerText.trim();
      var jdEl2 = document.querySelector(".styles_JDC__screature__19x01, .job-desc, section.job-desc");
      if (jdEl2) jd = jdEl2.innerText.trim();
    }

    if (!title) {
      title = document.title ? document.title.split("|")[0].split("-")[0].trim() : "Job Posting";
    }
    if (!company) {
      company = document.title ? document.title.split("|")[1] || "Company" : "Company";
    }
    if (!jd) {
      jd = document.body ? document.body.innerText.substring(0, 3000) : "";
    }

    // Show floating toast
    var toast = document.createElement("div");
    toast.style.cssText = "position:fixed;top:20px;right:20px;z-index:999999;background:#0f172a;color:#ffffff;padding:12px 18px;border-radius:10px;font-family:sans-serif;font-size:14px;box-shadow:0 10px 25px rgba(0,0,0,0.3);border:1px solid #334155;transition:all 0.3s ease;";
    toast.innerText = "⏳ Saving job to JobPilot...";
    document.body.appendChild(toast);

    fetch(appUrl + "/api/bookmarklet/save-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: token,
        company: company,
        role: title,
        jobDescriptionText: jd,
        source: source,
        url: url
      })
    })
    .then(function(res){ return res.json(); })
    .then(function(data){
      if (data.success) {
        toast.style.background = "#059669";
        toast.innerText = "✅ Saved to JobPilot as 'Saved'!";
      } else {
        toast.style.background = "#dc2626";
        toast.innerText = "❌ " + (data.error || "Failed to save job");
      }
      setTimeout(function(){ toast.remove(); }, 4000);
    })
    .catch(function(err){
      toast.style.background = "#dc2626";
      toast.innerText = "❌ Network error connecting to JobPilot";
      setTimeout(function(){ toast.remove(); }, 4000);
    });
  } catch(e) {
    alert("JobPilot Bookmarklet Error: " + e.message);
  }
})();`;

  return 'javascript:' + encodeURIComponent(script.replace(/\n\s*/g, ' '));
}

/**
 * Generate Bookmarklet B: Autofill from JobPilot
 */
export function generateAutofillBookmarkletScript(userToken: string, appHostUrl: string): string {
  const script = `(function(){
  try {
    var token = "${userToken}";
    var appUrl = "${appHostUrl}";

    var toast = document.createElement("div");
    toast.style.cssText = "position:fixed;top:20px;right:20px;z-index:999999;background:#0f172a;color:#ffffff;padding:12px 18px;border-radius:10px;font-family:sans-serif;font-size:14px;box-shadow:0 10px 25px rgba(0,0,0,0.3);border:1px solid #334155;transition:all 0.3s ease;";
    toast.innerText = "⚡ Fetching profile from JobPilot...";
    document.body.appendChild(toast);

    fetch(appUrl + "/api/bookmarklet/profile?token=" + encodeURIComponent(token))
    .then(function(res){ return res.json(); })
    .then(function(profile){
      if (!profile || profile.error) {
        toast.style.background = "#dc2626";
        toast.innerText = "❌ " + ((profile && profile.error) || "Failed to load candidate profile");
        setTimeout(function(){ toast.remove(); }, 4000);
        return;
      }

      var fieldMap = [
        { keys: ["name", "full name", "applicant name"], val: profile.name },
        { keys: ["email", "e-mail", "email address"], val: profile.email },
        { keys: ["phone", "mobile", "contact number", "phone number"], val: profile.phone },
        { keys: ["notice period", "availability", "notice", "serving notice"], val: profile.noticePeriod },
        { keys: ["current ctc", "current salary", "present ctc", "current compensation"], val: profile.currentCtc },
        { keys: ["expected ctc", "expected salary", "target ctc", "desired ctc"], val: profile.expectedCtc },
        { keys: ["portfolio", "website", "personal site", "portfolio url"], val: profile.portfolioUrl },
        { keys: ["linkedin", "linkedin url", "linkedin profile"], val: profile.linkedInUrl },
        { keys: ["years of experience", "total experience", "years exp", "experience in years"], val: profile.yearsOfExperience }
      ];

      var filledCount = 0;
      var inputs = Array.from(document.querySelectorAll("input, textarea, select"));

      function setNativeValue(element, value) {
        var prototype = Object.getPrototypeOf(element);
        var descriptor = Object.getOwnPropertyDescriptor(prototype, "value") ||
                           Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value") ||
                           Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
        if (descriptor && descriptor.set) {
          descriptor.set.call(element, value);
        } else {
          element.value = value;
        }
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
        element.dispatchEvent(new Event("blur", { bubbles: true }));
      }

      inputs.forEach(function(input) {
        if (input.type === "hidden" || input.type === "submit" || input.type === "button") return;

        var contextText = "";
        var id = input.id || "";
        var name = input.name || "";
        var placeholder = input.placeholder || "";
        var aria = input.getAttribute("aria-label") || "";

        contextText += " " + id + " " + name + " " + placeholder + " " + aria;

        if (input.id) {
          var labelEl = document.querySelector("label[for='" + CSS.escape(input.id) + "']");
          if (labelEl) contextText += " " + labelEl.innerText;
        }
        var parentLabel = input.closest("label");
        if (parentLabel) contextText += " " + parentLabel.innerText;

        var parentContainer = input.closest("div, li, fieldset");
        if (parentContainer) contextText += " " + parentContainer.innerText;

        contextText = contextText.toLowerCase();

        for (var i = 0; i < fieldMap.length; i++) {
          var item = fieldMap[i];
          if (!item.val) continue;

          for (var k = 0; k < item.keys.length; k++) {
            var key = item.keys[k];
            if (contextText.indexOf(key) !== -1) {
              setNativeValue(input, item.val);
              filledCount++;
              input.style.border = "2px solid #10b981";
              input.style.backgroundColor = "#ecfdf5";
              return;
            }
          }
        }
      });

      toast.style.background = "#059669";
      toast.innerText = "✨ Autofilled " + filledCount + " form field" + (filledCount === 1 ? "" : "s") + "!";
      setTimeout(function(){ toast.remove(); }, 4000);
    })
    .catch(function(err){
      toast.style.background = "#dc2626";
      toast.innerText = "❌ Error fetching profile for autofill";
      setTimeout(function(){ toast.remove(); }, 4000);
    });
  } catch(e) {
    alert("JobPilot Autofill Error: " + e.message);
  }
})();`;

  return 'javascript:' + encodeURIComponent(script.replace(/\n\s*/g, ' '));
}
