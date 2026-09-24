import Papa from "papaparse";

export function validateLinkedInUrl(value) {
  const input = String(value || "").trim();
  if (!input) return "";

  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Enter a complete HTTPS LinkedIn profile URL.");
  }

  const host = url.hostname.toLowerCase();

  if (
    url.protocol !== "https:" ||
    !(host === "linkedin.com" || host.endsWith(".linkedin.com")) ||
    !url.pathname.startsWith("/in/") ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error(
      "LinkedIn URLs must be HTTPS profile links, such as https://www.linkedin.com/in/name."
    );
  }

  return url.href;
}

export function validateContact(contact) {
  const result = {
    first_name: String(contact.first_name || "").trim(),
    last_name: String(contact.last_name || "").trim(),
    company: String(contact.company || "").trim(),
    job_title: String(contact.job_title || "").trim(),
    linkedin_url: validateLinkedInUrl(contact.linkedin_url)
  };

  if (!result.first_name || result.first_name.length > 100) {
    throw new Error("First name is required and must be at most 100 characters.");
  }

  if (result.last_name.length > 100) {
    throw new Error("Last name must be at most 100 characters.");
  }

  if (result.company.length > 200 || result.job_title.length > 200) {
    throw new Error("Company and job title must be at most 200 characters.");
  }

  if (result.linkedin_url.length > 500) {
    throw new Error("LinkedIn URL must be at most 500 characters.");
  }

  return result;
}

async function excelLibrary() {
  const module = await import("exceljs");
  return module.default || module;
}

function normalizeHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

export async function importContacts(file) {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Choose a file smaller than 5 MB.");
  }

  const extension = file.name.split(".").pop().toLowerCase();
  let rows;

  if (extension === "csv") {
    const parsed = Papa.parse(await file.text(), {
      skipEmptyLines: "greedy"
    });

    if (parsed.errors.length) {
      throw new Error(`CSV error: ${parsed.errors[0].message}`);
    }

    rows = parsed.data;
  } else if (extension === "xlsx") {
    const ExcelJS = await excelLibrary();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());

    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error("The workbook has no worksheets.");

    rows = [];
    worksheet.eachRow((row) => {
      const values = [];
      for (let column = 1; column <= worksheet.columnCount; column++) {
        values.push(row.getCell(column).text);
      }
      if (values.some((value) => value.trim())) rows.push(values);
    });
  } else {
    throw new Error("Use a .csv or .xlsx file. Convert older .xls files first.");
  }

  if (!rows?.length) throw new Error("The file is empty.");

  const headers = rows[0].map(normalizeHeader);

  if (!headers.includes("firstname")) {
    throw new Error('A "First Name" column is required.');
  }

  const data = rows.slice(1).filter((row) => row.some((value) => String(value).trim()));

  if (!data.length) throw new Error("The file contains no contacts.");
  if (data.length > 1000) {
    throw new Error("Import up to 1,000 contacts at a time.");
  }

  const aliases = {
    firstname: "first_name",
    lastname: "last_name",
    company: "company",
    jobtitle: "job_title",
    linkedinurl: "linkedin_url",
    linkedinprofileurl: "linkedin_url"
  };

  return data.map((row, index) => {
    const contact = {};

    headers.forEach((header, column) => {
      if (aliases[header]) contact[aliases[header]] = row[column] || "";
    });

    try {
      return validateContact(contact);
    } catch (error) {
      throw new Error(`Row ${index + 2}: ${error.message}`);
    }
  });
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportMessages(messages, format) {
  const headers = [
    "First Name",
    "Last Name",
    "Company",
    "LinkedIn URL",
    "Personalized Message",
    "Status"
  ];

  const rows = messages.map((message) => [
    message.first_name,
    message.last_name,
    message.company,
    message.linkedin_url,
    message.body,
    message.sent_at ? "Sent" : "Not Sent"
  ]);

  const filename = `personalized-messages-${new Date().toISOString().slice(0, 10)}`;

  if (format === "csv") {
    const csv = Papa.unparse(
      { fields: headers, data: rows },
      { escapeFormulae: true }
    );

    download("\uFEFF" + csv, `${filename}.csv`, "text/csv;charset=utf-8");
    return;
  }

  if (format === "xlsx") {
    const ExcelJS = await excelLibrary();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Messages");

    sheet.addRow(headers);
    sheet.addRows(rows);

    sheet.columns.forEach((column, index) => {
      column.width = index === 4 ? 85 : index === 3 ? 42 : 22;
    });

    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" }
    };

    sheet.getColumn(5).alignment = {
      wrapText: true,
      vertical: "top"
    };

    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = { from: "A1", to: "F1" };

    download(
      await workbook.xlsx.writeBuffer(),
      `${filename}.xlsx`,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    return;
  }

  const text = messages
    .map(
      (message) =>
        `${[message.first_name, message.last_name].filter(Boolean).join(" ")}\n` +
        `${"─".repeat(48)}\n${message.body}\n`
    )
    .join("\n");

  download(text, `${filename}.txt`, "text/plain;charset=utf-8");
}

export function downloadSampleCSV() {
  download(
    Papa.unparse({
      fields: [
        "First Name",
        "Last Name",
        "Company",
        "Job Title",
        "LinkedIn URL"
      ],
      data: [
        ["Nitin", "Kumar", "", "", ""],
        ["Abhinav", "Sharma", "", "", ""]
      ]
    }),
    "contacts-template.csv",
    "text/csv;charset=utf-8"
  );
}

