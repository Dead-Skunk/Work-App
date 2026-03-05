const NOTION_VERSION = "2022-06-28";

const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

const getEnv = (env, key) => (env && env[key] ? String(env[key]) : "");

const toRichText = (value) => {
  const text = String(value || "").trim();
  if (!text) return [];
  return [{ type: "text", text: { content: text } }];
};

const toTitle = (value) => {
  const text = String(value || "").trim();
  if (!text) return [];
  return [{ type: "text", text: { content: text } }];
};

const toDate = (value) => {
  const text = String(value || "").trim();
  if (!text) return { date: null };
  return { date: { start: text } };
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const toSelect = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;
  return { name: text };
};

const toCheckbox = (value) => Boolean(value);

const toPhone = (value) => {
  const text = String(value || "").trim();
  return text ? text : null;
};

const toEmail = (value) => {
  const text = String(value || "").trim();
  return text ? text : null;
};

const formatTitle = (payload) => {
  const name =
    payload.full_name ||
    payload.clientName ||
    payload.client_name ||
    payload.client_full_name ||
    "";
  const service = payload.serviceTitle || payload.serviceId || "Service Form";
  if (name) return `${name} - ${service}`;
  return `${service} - ${new Date().toLocaleDateString("en-US")}`;
};

const buildProperties = (payload, titlePropName) => {
  const properties = {};

  properties[titlePropName] = { title: toTitle(formatTitle(payload)) };
  properties["Service"] = { select: toSelect(payload.serviceTitle || payload.serviceId) };
  properties["Employee ID"] = { rich_text: toRichText(payload.employeeId) };
  properties["Client Name"] = {
    rich_text: toRichText(payload.full_name || payload.clientName || payload.client_name),
  };
  properties["Client Birthday"] = toDate(payload.birthday || payload.clientDob || payload.clientBirthday);
  properties["Client SSN Last4"] = {
    rich_text: toRichText(payload.ssn_last4 || payload.clientSsnLast4 || payload.clientSsn),
  };
  properties["Contact Phone"] = { phone_number: toPhone(payload.cell_phone || payload.clientPhone) };
  properties["Contact Email"] = { email: toEmail(payload.email || payload.clientEmail) };
  properties["Address"] = { rich_text: toRichText(payload.address || payload.clientAddress) };
  properties["City"] = { rich_text: toRichText(payload.city) };
  properties["State"] = { rich_text: toRichText(payload.state) };
  properties["Zip"] = { rich_text: toRichText(payload.zip_code) };
  properties["Preferred Contact"] = { select: toSelect(payload.preferred_contact_method) };
  properties["Referral Source"] = { rich_text: toRichText(payload.referral_source) };
  properties["Services Requested"] = { rich_text: toRichText(payload.services_requested) };
  properties["Situation"] = { rich_text: toRichText(payload.situation_description) };
  properties["Goals"] = { rich_text: toRichText(payload.goals) };
  properties["Additional Info"] = { rich_text: toRichText(payload.additional_information) };
  properties["Consent"] = { checkbox: toCheckbox(payload.consent_confirmation) };
  properties["Household Size"] = { number: toNumber(payload.householdSize) };
  properties["Monthly Income"] = { number: toNumber(payload.incomeMonthly) };
  properties["Employment Status"] = { select: toSelect(payload.employmentStatus) };
  properties["Dependents"] = { number: toNumber(payload.dependents) };
  properties["Utility Account"] = { rich_text: toRichText(payload.accountNumber) };
  properties["Balance Due"] = { number: toNumber(payload.balanceDue) };
  properties["Notes"] = { rich_text: toRichText(payload.notes) };
  properties["Representative Name"] = { rich_text: toRichText(payload.representative_name) };
  properties["Gender"] = { select: toSelect(payload.gender) };
  properties["Client Key"] = { rich_text: toRichText(payload.clientKey) };
  properties["Submitted At"] = toDate(payload.submittedAt);

  const files = payload.files || {};
  const fileSummary = Object.entries(files)
    .map(([key, file]) => `${key}: ${file.name || "file"} (${file.type || "type?"}, ${file.size || 0} bytes)`)
    .join("\n");

  const raw = JSON.stringify(
    {
      ...payload,
      files: Object.keys(files),
    },
    null,
    2
  );
  const rawText = raw.length > 1900 ? `${raw.slice(0, 1900)}...` : raw;
  properties["Attachments"] = { rich_text: toRichText(fileSummary) };
  properties["Raw Payload"] = { rich_text: toRichText(rawText) };

  return properties;
};

const schemaDefinition = [
  "Service (select)",
  "Employee ID (rich_text)",
  "Client Name (rich_text)",
  "Client Birthday (date)",
  "Client SSN Last4 (rich_text)",
  "Contact Phone (phone_number)",
  "Contact Email (email)",
  "Address (rich_text)",
  "City (rich_text)",
  "State (rich_text)",
  "Zip (rich_text)",
  "Preferred Contact (select)",
  "Referral Source (rich_text)",
  "Services Requested (rich_text)",
  "Situation (rich_text)",
  "Goals (rich_text)",
  "Additional Info (rich_text)",
  "Consent (checkbox)",
  "Household Size (number)",
  "Monthly Income (number)",
  "Employment Status (select)",
  "Dependents (number)",
  "Utility Account (rich_text)",
  "Balance Due (number)",
  "Notes (rich_text)",
  "Representative Name (rich_text)",
  "Gender (select)",
  "Client Key (rich_text)",
  "Submitted At (date)",
  "Attachments (rich_text)",
  "Raw Payload (rich_text)",
];

const schemaToProperty = (type) => {
  switch (type) {
    case "select":
      return { select: { options: [] } };
    case "rich_text":
      return { rich_text: {} };
    case "date":
      return { date: {} };
    case "number":
      return { number: { format: "number" } };
    case "checkbox":
      return { checkbox: {} };
    case "phone_number":
      return { phone_number: {} };
    case "email":
      return { email: {} };
    default:
      return { rich_text: {} };
  }
};

const buildSchemaProperties = (titlePropName, missingOnly = []) => {
  const missingSet = new Set(missingOnly);
  const properties = {};
  schemaDefinition.forEach((entry) => {
    const [name, typeRaw] = entry.split(" (");
    const type = (typeRaw || "").replace(")", "");
    if (!name || name === titlePropName) return;
    if (missingSet.size > 0 && !missingSet.has(name)) return;
    properties[name] = schemaToProperty(type);
  });
  return properties;
};

const ensureSchema = async (database, titlePropName) => {
  const existing = new Set(Object.keys(database.properties || {}));
  const required = schemaDefinition
    .map((entry) => entry.split(" (")[0])
    .filter((name) => name && name !== titlePropName);
  const missing = required.filter((name) => !existing.has(name));
  return missing;
};

export async function onRequestPost({ request, env }) {
  const notionToken = getEnv(env, "NOTION_API_KEY");
  const databaseId = getEnv(env, "NOTION_DATABASE_ID");
  if (!notionToken || !databaseId) {
    return jsonResponse({ error: "Missing NOTION_API_KEY or NOTION_DATABASE_ID" }, 500);
  }

  let payload = null;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const headers = {
    Authorization: `Bearer ${notionToken}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };

  const dbResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    headers,
  });
  if (!dbResponse.ok) {
    const text = await dbResponse.text();
    return jsonResponse({ error: "Failed to fetch database", details: text }, 500);
  }
  const database = await dbResponse.json();
  const titlePropName = Object.entries(database.properties || {}).find(
    ([, value]) => value.type === "title"
  )?.[0];
  if (!titlePropName) {
    return jsonResponse({ error: "Database has no title property" }, 500);
  }

  const missing = await ensureSchema(database, titlePropName);
  if (missing.length > 0) {
    const updateBody = { properties: buildSchemaProperties(titlePropName, missing) };
    const updateResponse = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(updateBody),
    });
    if (!updateResponse.ok) {
      const text = await updateResponse.text();
      return jsonResponse(
        {
          error: "Database schema missing required properties",
          missing,
          required: schemaDefinition,
          titleProperty: titlePropName,
          details: text,
        },
        400
      );
    }
  }

  const properties = buildProperties(payload, titlePropName);
  const pageResponse = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });

  if (!pageResponse.ok) {
    const text = await pageResponse.text();
    return jsonResponse({ error: "Failed to create page", details: text }, 500);
  }

  const page = await pageResponse.json();
  return jsonResponse({ ok: true, pageId: page.id });
}

