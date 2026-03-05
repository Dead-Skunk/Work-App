/* Simple PWA-style client app with configurable auth and form submission */
const CONFIG = {
  notionWebhookUrl: "", // TODO: set to your backend endpoint that writes to Notion
  authEndpoint: "", // TODO: set to your backend endpoint that validates employee sign-in
  allowOfflineAuth: true, // DEV ONLY: allow sign-in without a server
  allowOfflineSubmit: true, // DEV ONLY: allow save without a server
  ...(window.APP_CONFIG || {}),
};

const INTAKE_SERVICE_ID = "client-intake";
const STORAGE_KEY = "field-forms-state-v1";
const AUTH_STORAGE_KEY = "field-forms-auth-v1";
const appState = {
  employeeId: "",
  currentClientKey: "",
  intakeMap: {},
  language: "en",
  authenticated: false,
  authToken: "",
  authExpiresAt: 0,
};

const I18N = {
  en: {
    language: "Language",
    signOut: "Sign out",
    loginTitle: "Employee Sign In",
    loginDesc: "Use your employee ID to sign in.",
    employeeId: "Employee ID",
    signIn: "Sign in",
    formsTitle: "Service Forms",
    formsDesc: "Select a service to open the form.",
    clientStatusUnset: "Current client: not set",
    clientStatusSet: "Current client: {client}",
    clientBirthday: "Client birthday",
    clientSsn: "Last 4 SSN",
    setClient: "Set Client",
    clear: "Clear",
    back: "Back",
    submitForm: "Submit Form",
    intakeLockedTile: "Set a client and complete intake first.",
    intakeLockedToast: "Set a client and complete the Client Intake form before other services.",
    missingEmployeeId: "Please enter your employee ID.",
    missingClientKey: "Enter a client birthday and last 4 SSN.",
    clientNotFound: "No intake found for that client.",
    missingClient: "Set a client and complete intake first.",
    submittedNotion: "Submitted to Notion.",
    savedLocal: "Saved locally (Notion endpoint not set).",
    submitFailed: "Submission failed. Try again.",
    authMissingEndpoint: "Sign-in is unavailable. Contact an admin.",
    authFailed: "Sign-in failed. Check your employee ID.",
    authNetwork: "Sign-in failed. Try again.",
    validationZip: "Enter a 5-digit ZIP code.",
    validationSsn: "Enter the last 4 digits of SSN.",
    validationPhone: "Enter a 10-digit phone number.",
    validationEmail: "Enter a valid email address.",
  },
  es: {
    language: "Idioma",
    signOut: "Cerrar sesión",
    loginTitle: "Ingreso de Empleado",
    loginDesc: "Use su ID de empleado para ingresar.",
    employeeId: "ID de empleado",
    signIn: "Ingresar",
    formsTitle: "Formularios de Servicio",
    formsDesc: "Seleccione un servicio para abrir el formulario.",
    clientStatusUnset: "Cliente actual: no establecido",
    clientStatusSet: "Cliente actual: {client}",
    clientBirthday: "Fecha de nacimiento del cliente",
    clientSsn: "Últimos 4 del SSN",
    setClient: "Establecer cliente",
    clear: "Borrar",
    back: "Atrás",
    submitForm: "Enviar formulario",
    intakeLockedTile: "Primero establezca un cliente y complete la admisión.",
    intakeLockedToast: "Establezca un cliente y complete el formulario de admisión antes de otros servicios.",
    missingEmployeeId: "Por favor ingrese su ID de empleado.",
    missingClientKey: "Ingrese fecha de nacimiento y los últimos 4 del SSN.",
    clientNotFound: "No se encontró admisión para ese cliente.",
    missingClient: "Establezca un cliente y complete la admisión primero.",
    submittedNotion: "Enviado a Notion.",
    savedLocal: "Guardado localmente (endpoint de Notion no configurado).",
    submitFailed: "Error al enviar. Intente de nuevo.",
    authMissingEndpoint: "El ingreso no está disponible. Contacte a un administrador.",
    authFailed: "Ingreso fallido. Verifique su ID de empleado.",
    authNetwork: "Ingreso fallido. Intente de nuevo.",
    validationZip: "Ingrese un código postal de 5 dígitos.",
    validationSsn: "Ingrese los últimos 4 dígitos del SSN.",
    validationPhone: "Ingrese un número de teléfono de 10 dígitos.",
    validationEmail: "Ingrese un correo electrónico válido.",
  },
  vi: {
    language: "Ngôn ngữ",
    signOut: "Đăng xuất",
    loginTitle: "Đăng Nhập Nhân Viên",
    loginDesc: "Dùng ID nhân viên để đăng nhập.",
    employeeId: "ID nhân viên",
    signIn: "Đăng nhập",
    formsTitle: "Biểu Mẫu Dịch Vụ",
    formsDesc: "Chọn dịch vụ để mở biểu mẫu.",
    clientStatusUnset: "Khách hàng hiện tại: chưa chọn",
    clientStatusSet: "Khách hàng hiện tại: {client}",
    clientBirthday: "Ngày sinh khách hàng",
    clientSsn: "4 số cuối SSN",
    setClient: "Chọn khách hàng",
    clear: "Xóa",
    back: "Quay lại",
    submitForm: "Gửi biểu mẫu",
    intakeLockedTile: "Hãy chọn khách hàng và hoàn tất tiếp nhận trước.",
    intakeLockedToast: "Hãy chọn khách hàng và hoàn tất biểu mẫu tiếp nhận trước các dịch vụ khác.",
    missingEmployeeId: "Vui lòng nhập ID nhân viên.",
    missingClientKey: "Nhập ngày sinh và 4 số cuối SSN.",
    clientNotFound: "Không tìm thấy hồ sơ tiếp nhận cho khách hàng này.",
    missingClient: "Hãy chọn khách hàng và hoàn tất tiếp nhận trước.",
    submittedNotion: "Đã gửi đến Notion.",
    savedLocal: "Đã lưu cục bộ (chưa thiết lập Notion).",
    submitFailed: "Gửi thất bại. Vui lòng thử lại.",
    authMissingEndpoint: "Không thể đăng nhập. Vui lòng liên hệ quản trị.",
    authFailed: "Đăng nhập thất bại. Kiểm tra ID nhân viên.",
    authNetwork: "Đăng nhập thất bại. Vui lòng thử lại.",
    validationZip: "Nhập mã bưu điện 5 chữ số.",
    validationSsn: "Nhập 4 số cuối SSN.",
    validationPhone: "Nhập số điện thoại 10 chữ số.",
    validationEmail: "Nhập địa chỉ email hợp lệ.",
  },
};

const t = (key, vars = {}) => {
  const lang = getLanguage();
  const table = I18N[lang] || I18N.en;
  let value = table[key] || I18N.en[key] || key;
  Object.entries(vars).forEach(([name, v]) => {
    value = value.replace(`{${name}}`, v);
  });
  return value;
};

const updateHeaderLabels = () => {
  const langLabel = document.getElementById("langLabel");
  if (langLabel) langLabel.textContent = t("language");
  if (logoutBtn) logoutBtn.textContent = t("signOut");
};

const SERVICES = [
  {
    id: INTAKE_SERVICE_ID,
    title: {
      en: "Client Intake Registration Form",
      es: "Formulario de Registro de Admisión de Clientes",
      vi: "Biểu Mẫu Đăng Ký Tiếp Nhận Khách Hàng",
    },
    description: {
      en: "Intake form for new Latino Solutions clients to collect contact details, service needs, and goals.",
      es: "Formulario de admisión para nuevos clientes de Latino Solutions para recopilar datos de contacto, necesidades de servicio y metas.",
      vi: "Biểu mẫu tiếp nhận cho khách hàng mới của Latino Solutions để thu thập thông tin liên lạc, nhu cầu dịch vụ và mục tiêu.",
    },
    fields: [
      {
        name: "representative_name",
        label: {
          en: "Representative Name",
          es: "Nombre de Representante",
          vi: "Tên Người Đại Diện",
        },
        type: "text",
      },
      {
        type: "section",
        label: { en: "Client Information", es: "Información del Cliente", vi: "Thông Tin Khách Hàng" },
      },
      { name: "full_name", label: { en: "Name", es: "Nombre", vi: "Họ Tên" }, type: "text", required: true },
      { name: "address", label: { en: "Address", es: "Dirección", vi: "Địa Chỉ" }, type: "text", required: true },
      { name: "city", label: { en: "City", es: "Ciudad", vi: "Thành Phố" }, type: "text", required: true },
      { name: "state", label: { en: "State", es: "Estado", vi: "Tiểu Bang" }, type: "text", required: true },
      {
        name: "zip_code",
        label: { en: "Zip Code", es: "Código Postal", vi: "Mã Bưu Điện" },
        type: "text",
        required: true,
        pattern: "\\d{5}",
        inputmode: "numeric",
        maxlength: 5,
      },
      {
        name: "ssn_last4",
        label: { en: "Last 4 of SSN", es: "Últimos 4 del SSN", vi: "4 Số Cuối SSN" },
        type: "text",
        required: true,
        pattern: "\\d{4}",
        inputmode: "numeric",
        maxlength: 4,
      },
      {
        name: "cell_phone",
        label: { en: "Cell Phone", es: "Teléfono Celular", vi: "Số Điện Thoại Di Động" },
        type: "tel",
        required: true,
      },
      { name: "email", label: { en: "Email", es: "Correo", vi: "Email" }, type: "email" },
      {
        name: "birthday",
        label: { en: "Birthday", es: "Fecha de Nacimiento", vi: "Ngày Sinh" },
        type: "date",
        required: true,
      },
      {
        name: "gender",
        label: { en: "Gender", es: "Género", vi: "Giới Tính" },
        type: "select",
        options: [
          { value: "Male", label: { en: "Male", es: "Masculino", vi: "Nam" } },
          { value: "Female", label: { en: "Female", es: "Femenino", vi: "Nữ" } },
          { value: "Other", label: { en: "Other", es: "Otro", vi: "Khác" } },
          {
            value: "Prefer not to say",
            label: { en: "Prefer not to say", es: "Prefiero no decir", vi: "Không Muốn Trả Lời" },
          },
        ],
      },
      {
        name: "preferred_contact_method",
        label: { en: "Preferred Method of Contact", es: "Método de Contacto Preferido", vi: "Phương Thức Liên Hệ Ưu Tiên" },
        type: "select",
        required: true,
        options: [
          { value: "Call", label: { en: "Call", es: "Llamada", vi: "Gọi Điện" } },
          { value: "Text", label: { en: "Text", es: "Texto", vi: "Nhắn Tin" } },
          { value: "Email", label: { en: "Email", es: "Correo", vi: "Email" } },
        ],
      },
      {
        name: "referral_source",
        label: {
          en: "How did you hear about Latino Solutions?",
          es: "¿Cómo se enteró de Latino Solutions?",
          vi: "Bạn biết về Latino Solutions như thế nào?",
        },
        type: "text",
      },
      {
        name: "services_requested",
        label: { en: "What services are you seeking?", es: "¿Qué servicios está buscando?", vi: "Bạn đang tìm dịch vụ gì?" },
        type: "textarea",
      },
      {
        name: "situation_description",
        label: {
          en: "Briefly describe your situation",
          es: "Describa brevemente su situación",
          vi: "Mô tả ngắn gọn hoàn cảnh của bạn",
        },
        type: "textarea",
      },
      {
        name: "goals",
        label: {
          en: "Main goals and outcomes you want",
          es: "Metas y resultados principales que desea",
          vi: "Mục tiêu và kết quả bạn mong muốn",
        },
        type: "textarea",
      },
      {
        name: "additional_information",
        label: {
          en: "Anything else you would like us to know",
          es: "¿Hay algo más que le gustaría que supiéramos?",
          vi: "Bạn có muốn chúng tôi biết thêm điều gì không?",
        },
        type: "textarea",
      },
      {
        name: "consent_confirmation",
        label: {
          en: "I confirm the information provided is accurate and agree to the terms of service and privacy policy.",
          es: "Confirmo que la información proporcionada es correcta y acepto los términos de servicio y la política de privacidad.",
          vi: "Tôi xác nhận thông tin đã cung cấp là chính xác và đồng ý với điều khoản dịch vụ và chính sách bảo mật.",
        },
        type: "select",
        required: true,
        options: [{ value: "I Agree", label: { en: "I Agree", es: "Acepto", vi: "Tôi Đồng Ý" } }],
      },
    ],
  },
  {
    id: "housing",
    title: { en: "Housing Assistance", es: "Asistencia de Vivienda", vi: "Hỗ Trợ Nhà Ở" },
    description: {
      en: "Rental help, eviction prevention, or shelter referral.",
      es: "Ayuda con alquiler, prevención de desalojo o referencia a refugio.",
      vi: "Hỗ trợ tiền thuê nhà, ngăn ngừa bị đuổi nhà hoặc giới thiệu nơi trú ẩn.",
    },
    fields: [
      { type: "section", label: { en: "Client Details", es: "Detalles del Cliente", vi: "Thông Tin Khách Hàng" } },
      { name: "clientName", label: { en: "Client Full Name", es: "Nombre Completo del Cliente", vi: "Họ Tên Khách Hàng" }, type: "text", required: true },
      { name: "clientDob", label: { en: "Date of Birth", es: "Fecha de Nacimiento", vi: "Ngày Sinh" }, type: "date", required: true },
      { name: "clientPhone", label: { en: "Phone Number", es: "Número de Teléfono", vi: "Số Điện Thoại" }, type: "tel" },
      { name: "clientAddress", label: { en: "Current Address", es: "Dirección Actual", vi: "Địa Chỉ Hiện Tại" }, type: "text" },
      { type: "section", label: { en: "Household", es: "Hogar", vi: "Hộ Gia Đình" } },
      { name: "householdSize", label: { en: "Household Size", es: "Tamaño del Hogar", vi: "Số Người Trong Hộ" }, type: "number", min: 1 },
      { name: "incomeMonthly", label: { en: "Monthly Income", es: "Ingresos Mensuales", vi: "Thu Nhập Hàng Tháng" }, type: "number" },
      { name: "notes", label: { en: "Additional Notes", es: "Notas Adicionales", vi: "Ghi Chú Bổ Sung" }, type: "textarea" },
      { name: "photoId", label: { en: "Photo ID", es: "Identificación con Foto", vi: "Ảnh Giấy Tờ Tùy Thân" }, type: "file", accept: "image/*", capture: "environment" },
    ],
  },
  {
    id: "food",
    title: { en: "Food Stamps", es: "Cupones de Alimentos", vi: "Trợ Cấp Thực Phẩm" },
    description: { en: "SNAP application intake.", es: "Admisión para solicitud SNAP.", vi: "Tiếp nhận hồ sơ SNAP." },
    fields: [
      { type: "section", label: { en: "Client Details", es: "Detalles del Cliente", vi: "Thông Tin Khách Hàng" } },
      { name: "clientName", label: { en: "Client Full Name", es: "Nombre Completo del Cliente", vi: "Họ Tên Khách Hàng" }, type: "text", required: true },
      { name: "clientEmail", label: { en: "Email", es: "Correo", vi: "Email" }, type: "email" },
      { name: "clientPhone", label: { en: "Phone Number", es: "Número de Teléfono", vi: "Số Điện Thoại" }, type: "tel" },
      { type: "section", label: { en: "Eligibility", es: "Elegibilidad", vi: "Điều Kiện" } },
      {
        name: "employmentStatus",
        label: { en: "Employment Status", es: "Estado Laboral", vi: "Tình Trạng Việc Làm" },
        type: "select",
        options: [
          { value: "Employed", label: { en: "Employed", es: "Empleado", vi: "Có Việc Làm" } },
          { value: "Unemployed", label: { en: "Unemployed", es: "Desempleado", vi: "Thất Nghiệp" } },
          { value: "Self-employed", label: { en: "Self-employed", es: "Trabajador por Cuenta Propia", vi: "Tự Kinh Doanh" } },
        ],
      },
      { name: "dependents", label: { en: "Number of Dependents", es: "Número de Dependientes", vi: "Số Người Phụ Thuộc" }, type: "number", min: 0 },
      { name: "notes", label: { en: "Additional Notes", es: "Notas Adicionales", vi: "Ghi Chú Bổ Sung" }, type: "textarea" },
      { name: "incomeProof", label: { en: "Proof of Income", es: "Comprobante de Ingresos", vi: "Bằng Chứng Thu Nhập" }, type: "file", accept: "image/*", capture: "environment" },
    ],
  },
  {
    id: "utility",
    title: { en: "Utility Support", es: "Apoyo de Servicios Públicos", vi: "Hỗ Trợ Tiện Ích" },
    description: { en: "Utility shutoff prevention.", es: "Prevención de corte de servicios.", vi: "Ngăn ngừa cắt dịch vụ tiện ích." },
    fields: [
      { type: "section", label: { en: "Client Details", es: "Detalles del Cliente", vi: "Thông Tin Khách Hàng" } },
      { name: "clientName", label: { en: "Client Full Name", es: "Nombre Completo del Cliente", vi: "Họ Tên Khách Hàng" }, type: "text", required: true },
      { name: "accountNumber", label: { en: "Utility Account #", es: "Cuenta de Servicios #", vi: "Số Tài Khoản Tiện Ích" }, type: "text" },
      { name: "balanceDue", label: { en: "Balance Due", es: "Saldo Adeudado", vi: "Số Dư Cần Trả" }, type: "number" },
      { name: "notes", label: { en: "Additional Notes", es: "Notas Adicionales", vi: "Ghi Chú Bổ Sung" }, type: "textarea" },
      { name: "billPhoto", label: { en: "Utility Bill Photo", es: "Foto de Factura", vi: "Ảnh Hóa Đơn Tiện Ích" }, type: "file", accept: "image/*", capture: "environment" },
    ],
  },
];

const viewRoot = document.getElementById("viewRoot");
const logoutBtn = document.getElementById("logoutBtn");

const getEmployeeId = () => appState.employeeId;
const setEmployeeId = (id) => {
  appState.employeeId = id;
  persistState();
};
const clearEmployeeId = () => {
  appState.employeeId = "";
  persistState();
};
const getLanguage = () => appState.language || "en";
const setLanguage = (lang) => {
  appState.language = lang || "en";
  persistState();
};
const getIntakeMap = () => appState.intakeMap || {};
const setIntakeMap = (map) => {
  appState.intakeMap = map || {};
  persistState();
};
const getCurrentClientKey = () => appState.currentClientKey;
const setCurrentClientKey = (value) => {
  appState.currentClientKey = value || "";
  persistState();
};
const clearCurrentClientKey = () => {
  appState.currentClientKey = "";
  persistState();
};
const isAuthenticated = () => {
  if (!appState.authenticated) return false;
  const expiresAt = getAuthExpiresAt();
  if (expiresAt && Date.now() > expiresAt) {
    clearAuthSession();
    return false;
  }
  return Boolean(getAuthToken());
};
const setAuthenticated = (value) => {
  appState.authenticated = Boolean(value);
};
const clearAuthenticated = () => {
  appState.authenticated = false;
};
const getAuthToken = () => appState.authToken || "";
const getAuthExpiresAt = () => appState.authExpiresAt || 0;
const setAuthSession = (token, expiresAt) => {
  appState.authToken = token || "";
  appState.authExpiresAt = expiresAt || 0;
  setAuthenticated(Boolean(token));
  persistAuth();
};
const clearAuthSession = () => {
  appState.authToken = "";
  appState.authExpiresAt = 0;
  clearAuthenticated();
  persistAuth();
};
const persistState = () => {
  try {
    const payload = {
      employeeId: appState.employeeId,
      currentClientKey: appState.currentClientKey,
      intakeMap: appState.intakeMap,
      language: appState.language,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Storage is optional; ignore failures.
  }
};
const loadState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    appState.employeeId = data.employeeId || "";
    appState.currentClientKey = data.currentClientKey || "";
    appState.intakeMap = data.intakeMap || {};
    appState.language = data.language || "en";
  } catch (error) {
    // Ignore corrupted storage.
  }
};
const persistAuth = () => {
  try {
    const payload = {
      token: appState.authToken,
      expiresAt: appState.authExpiresAt,
    };
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Auth storage is optional; ignore failures.
  }
};
const loadAuth = () => {
  try {
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    const token = data.token || "";
    const expiresAt = Number(data.expiresAt || 0);
    if (!token) return;
    if (expiresAt && Date.now() > expiresAt) {
      clearAuthSession();
      return;
    }
    appState.authToken = token;
    appState.authExpiresAt = expiresAt;
    setAuthenticated(true);
  } catch (error) {
    // Ignore corrupted storage.
  }
};

const normalizeBirthday = (value) => String(value || "").trim();
const normalizeSsnLast4 = (value) => String(value || "").replace(/\D/g, "").slice(-4);
const buildClientKey = (birthday, ssnLast4) => {
  const normalizedBirthday = normalizeBirthday(birthday);
  const normalizedSsn = normalizeSsnLast4(ssnLast4);
  if (!normalizedBirthday || normalizedSsn.length !== 4) return "";
  return `${normalizedBirthday}|${normalizedSsn}`;
};
const parseClientKey = (key) => {
  if (!key) return { birthday: "", ssnLast4: "" };
  const [birthday, ssnLast4] = key.split("|");
  return { birthday: birthday || "", ssnLast4: ssnLast4 || "" };
};
const formatClientKey = (key) => {
  if (!key) return "";
  const [birthday, ssn] = key.split("|");
  if (!birthday || !ssn) return key;
  return `${birthday} • ***${ssn}`;
};

const getText = (value) => {
  if (typeof value === "string") return value;
  const lang = getLanguage();
  return value[lang] || value.en || "";
};

const formatPhone = (value) => {
  const digits = getDigits(value).slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const toast = (message) => {
  const tpl = document.getElementById("toastTemplate");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.textContent = message;
  document.body.appendChild(node);
  requestAnimationFrame(() => node.classList.add("show"));
  setTimeout(() => {
    node.classList.remove("show");
    setTimeout(() => node.remove(), 300);
  }, 2600);
};

const showLogin = () => {
  viewRoot.innerHTML = "";
  const tpl = document.getElementById("loginView");
  const node = tpl.content.cloneNode(true);
  viewRoot.appendChild(node);
  logoutBtn.classList.add("hidden");

  const loginTitle = document.getElementById("loginTitle");
  const loginDesc = document.getElementById("loginDesc");
  const loginEmployeeIdLabel = document.getElementById("loginEmployeeIdLabel");
  const loginSubmitBtn = document.getElementById("loginSubmitBtn");
  if (loginTitle) loginTitle.textContent = t("loginTitle");
  if (loginDesc) loginDesc.textContent = t("loginDesc");
  if (loginEmployeeIdLabel) loginEmployeeIdLabel.textContent = t("employeeId");
  if (loginSubmitBtn) loginSubmitBtn.textContent = t("signIn");

  const form = document.getElementById("loginForm");
  const employeeInput = form.querySelector("input[name=\"employeeId\"]");
  if (employeeInput && getEmployeeId()) {
    employeeInput.value = getEmployeeId();
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const employeeId = String(data.get("employeeId") || "").trim();
    if (!employeeId) {
      toast(t("missingEmployeeId"));
      return;
    }
    if (!CONFIG.authEndpoint) {
      if (CONFIG.allowOfflineAuth) {
        setEmployeeId(employeeId);
        setAuthSession("dev-token", 0);
        showForms();
        return;
      }
      toast(t("authMissingEndpoint"));
      return;
    }
    try {
      const response = await fetch(CONFIG.authEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      if (!response.ok) {
        toast(t("authFailed"));
        return;
      }
      let token = "";
      let expiresAt = 0;
      try {
        const payload = await response.json();
        token = String(payload.token || "");
        const expiresIn = Number(payload.expiresIn || 0);
        if (expiresIn > 0) {
          expiresAt = Date.now() + expiresIn * 1000;
        }
        if (!token && payload.sessionToken) {
          token = String(payload.sessionToken || "");
        }
      } catch (error) {
        // If the response isn't JSON, treat as auth failure.
      }
      if (!token) {
        toast(t("authFailed"));
        return;
      }
      setEmployeeId(employeeId);
      setAuthSession(token, expiresAt);
      showForms();
    } catch (error) {
      console.error(error);
      toast(t("authNetwork"));
    }
  });
};

const showForms = () => {
  if (!isAuthenticated()) {
    showLogin();
    return;
  }
  viewRoot.innerHTML = "";
  const tpl = document.getElementById("formsView");
  const node = tpl.content.cloneNode(true);
  viewRoot.appendChild(node);
  logoutBtn.classList.remove("hidden");

  const formsTitle = document.getElementById("formsTitle");
  const formsDesc = document.getElementById("formsDesc");
  const clientBirthdayLabel = document.getElementById("clientBirthdayLabel");
  const clientSsnLabel = document.getElementById("clientSsnLabel");
  const setClientBtn = document.getElementById("setClientBtn");
  const clearClientBtn = document.getElementById("clearClientBtn");
  if (formsTitle) formsTitle.textContent = t("formsTitle");
  if (formsDesc) formsDesc.textContent = t("formsDesc");
  if (clientBirthdayLabel) clientBirthdayLabel.textContent = t("clientBirthday");
  if (clientSsnLabel) clientSsnLabel.textContent = t("clientSsn");
  if (setClientBtn) setClientBtn.textContent = t("setClient");
  if (clearClientBtn) clearClientBtn.textContent = t("clear");

  const clientStatus = document.getElementById("clientStatus");
  const clientLookupForm = document.getElementById("clientLookupForm");
  const clearClientBtnAction = document.getElementById("clearClientBtn");
  const currentClient = getCurrentClientKey();
  if (currentClient) {
    clientStatus.textContent = t("clientStatusSet", { client: formatClientKey(currentClient) });
  } else {
    clientStatus.textContent = t("clientStatusUnset");
  }

  clientLookupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(clientLookupForm);
    const birthday = normalizeBirthday(data.get("clientBirthday"));
    const ssnLast4 = normalizeSsnLast4(data.get("clientSsnLast4"));
    if (!birthday || ssnLast4.length !== 4) {
      toast(t("missingClientKey"));
      return;
    }
    const intakeMap = getIntakeMap();
    const key = buildClientKey(birthday, ssnLast4);
    if (!intakeMap[key]) {
      toast(t("clientNotFound"));
      return;
    }
    setCurrentClientKey(key);
    showForms();
  });

  clearClientBtnAction.addEventListener("click", () => {
    clearCurrentClientKey();
    showForms();
  });
  applyInputMasks(clientLookupForm);

  const grid = document.getElementById("formsGrid");
  const intakeMap = getIntakeMap();
  const intakeCompleted = currentClient && Boolean(intakeMap[currentClient]);
  SERVICES.forEach((service) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.innerHTML = `<h3>${getText(service.title)}</h3><p class="muted">${getText(
      service.description
    )}</p>`;

    if (service.id !== INTAKE_SERVICE_ID && !intakeCompleted) {
      tile.classList.add("disabled");
      tile.setAttribute("aria-disabled", "true");
      tile.innerHTML += `<p class="muted">${t("intakeLockedTile")}</p>`;
      tile.addEventListener("click", () => {
        toast(t("intakeLockedToast"));
      });
    } else {
      tile.addEventListener("click", () => showFormDetail(service.id));
    }
    grid.appendChild(tile);
  });
};

const createField = (field) => {
  if (field.type === "section") {
    const h3 = document.createElement("h3");
    h3.className = "section-title";
    h3.textContent = getText(field.label);
    return h3;
  }

  const label = document.createElement("label");
  label.textContent = getText(field.label);

  let input;
  if (field.type === "textarea") {
    input = document.createElement("textarea");
  } else if (field.type === "select") {
    input = document.createElement("select");
    field.options.forEach((option) => {
      const opt = document.createElement("option");
      if (typeof option === "string") {
        opt.value = option;
        opt.textContent = option;
      } else {
        opt.value = option.value;
        opt.textContent = getText(option.label);
      }
      input.appendChild(opt);
    });
  } else {
    input = document.createElement("input");
    input.type = field.type;
  }

  input.name = field.name;
  if (field.required) input.required = true;
  if (field.min !== undefined) input.min = field.min;
  if (field.pattern) input.pattern = field.pattern;
  if (field.inputmode) input.inputMode = field.inputmode;
  if (field.maxlength) input.maxLength = field.maxlength;
  if (field.accept) input.accept = field.accept;
  if (field.capture) input.capture = field.capture;
  if (field.type === "tel") input.inputMode = "numeric";

  label.appendChild(input);
  return label;
};

const showFormDetail = (serviceId) => {
  const service = SERVICES.find((item) => item.id === serviceId);
  if (!service) return showForms();
  const currentClient = getCurrentClientKey();
  const intakeMap = getIntakeMap();
  if (service.id !== INTAKE_SERVICE_ID && (!currentClient || !intakeMap[currentClient])) {
    toast(t("intakeLockedToast"));
    return showForms();
  }

  viewRoot.innerHTML = "";
  const tpl = document.getElementById("formDetailView");
  const node = tpl.content.cloneNode(true);
  viewRoot.appendChild(node);

  document.getElementById("formTitle").textContent = getText(service.title);
  document.getElementById("formDesc").textContent = getText(service.description);

  const backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.textContent = t("back");
  backBtn.addEventListener("click", () => showForms());

  const form = document.getElementById("serviceForm");
  service.fields.forEach((field) => form.appendChild(createField(field)));
  applyInputMasks(form);

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "primary";
  submit.textContent = t("submitForm");
  form.appendChild(submit);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateForm(form, serviceId)) {
      return;
    }
    const data = new FormData(form);
    const payload = { serviceId, serviceTitle: getText(service.title), employeeId: getEmployeeId() };
    const files = {};
    const currentClient = getCurrentClientKey();
    const intakeMap = getIntakeMap();

    if (serviceId !== INTAKE_SERVICE_ID && (!currentClient || !intakeMap[currentClient])) {
      toast(t("missingClient"));
      return;
    }

    for (const [key, value] of data.entries()) {
      if (value instanceof File) {
        if (value.size === 0) continue;
        files[key] = {
          name: value.name,
          type: value.type,
          size: value.size,
          dataUrl: await fileToDataUrl(value),
        };
      } else {
        payload[key] = value;
      }
    }

    payload.files = files;
    payload.submittedAt = new Date().toISOString();
    if (currentClient) {
      const { birthday, ssnLast4 } = parseClientKey(currentClient);
      payload.clientKey = currentClient;
      payload.clientBirthday = birthday;
      payload.clientSsnLast4 = ssnLast4;
    }

    try {
      if (CONFIG.notionWebhookUrl) {
        const headers = { "Content-Type": "application/json" };
        const token = getAuthToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        const response = await fetch(CONFIG.notionWebhookUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(`Submit failed (${response.status})`);
        }
        toast(t("submittedNotion"));
      } else {
        console.log("Form payload", payload);
        toast(t("savedLocal"));
      }
      if (serviceId === INTAKE_SERVICE_ID) {
        const birthday = normalizeBirthday(payload.birthday);
        const ssnLast4 = normalizeSsnLast4(payload.ssn_last4);
        const key = buildClientKey(birthday, ssnLast4);
        if (key) {
          const intakeMap = getIntakeMap();
          intakeMap[key] = payload.submittedAt;
          setIntakeMap(intakeMap);
          setCurrentClientKey(key);
        }
      }
      form.reset();
      showForms();
    } catch (error) {
      console.error(error);
      if (CONFIG.allowOfflineSubmit) {
        console.log("Form payload (offline)", payload);
        toast(t("savedLocal"));
        if (serviceId === INTAKE_SERVICE_ID) {
          const birthday = normalizeBirthday(payload.birthday);
          const ssnLast4 = normalizeSsnLast4(payload.ssn_last4);
          const key = buildClientKey(birthday, ssnLast4);
          if (key) {
            const intakeMap = getIntakeMap();
            intakeMap[key] = payload.submittedAt;
            setIntakeMap(intakeMap);
            setCurrentClientKey(key);
          }
        }
        form.reset();
        showForms();
        return;
      }
      toast(t("submitFailed"));
    }
  });
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File read failed"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

const resetValidity = (form) => {
  Array.from(form.elements).forEach((el) => {
    if (el && typeof el.setCustomValidity === "function") {
      el.setCustomValidity("");
    }
  });
};

const getDigits = (value) => String(value || "").replace(/\D/g, "");

const validateDigitsField = (input, length, messageKey) => {
  if (!input) return true;
  const digits = getDigits(input.value);
  if (input.required && digits.length !== length) {
    input.setCustomValidity(t(messageKey));
    return false;
  }
  if (!input.required && input.value && digits.length !== length) {
    input.setCustomValidity(t(messageKey));
    return false;
  }
  return true;
};

const validateEmailField = (input) => {
  if (!input || !input.value) return true;
  const emailValue = String(input.value || "").trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  if (!emailOk) {
    input.setCustomValidity(t("validationEmail"));
    return false;
  }
  return true;
};

const validateForm = (form, serviceId) => {
  resetValidity(form);
  let ok = true;

  const zip = form.elements.namedItem("zip_code");
  if (zip && !validateDigitsField(zip, 5, "validationZip")) ok = false;

  const ssn = form.elements.namedItem("ssn_last4");
  if (ssn && !validateDigitsField(ssn, 4, "validationSsn")) ok = false;

  const clientSsn = form.elements.namedItem("clientSsnLast4");
  if (clientSsn && !validateDigitsField(clientSsn, 4, "validationSsn")) ok = false;

  const cell = form.elements.namedItem("cell_phone");
  if (cell && !validateDigitsField(cell, 10, "validationPhone")) ok = false;

  const home = form.elements.namedItem("home_phone");
  if (home && !validateDigitsField(home, 10, "validationPhone")) ok = false;

  const clientPhone = form.elements.namedItem("clientPhone");
  if (clientPhone && !validateDigitsField(clientPhone, 10, "validationPhone")) ok = false;

  const phoneNumber = form.elements.namedItem("clientPhoneNumber");
  if (phoneNumber && !validateDigitsField(phoneNumber, 10, "validationPhone")) ok = false;

  const email = form.elements.namedItem("email");
  if (email && !validateEmailField(email)) ok = false;

  const clientEmail = form.elements.namedItem("clientEmail");
  if (clientEmail && !validateEmailField(clientEmail)) ok = false;

  if (!ok) {
    form.reportValidity();
  }
  return ok;
};

const applyInputMasks = (form) => {
  if (!form) return;
  const maskDigits = (input, maxLen) => {
    if (!input) return;
    input.addEventListener("input", () => {
      input.value = getDigits(input.value).slice(0, maxLen);
    });
  };
  const maskPhone = (input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      input.value = formatPhone(input.value);
    });
  };

  maskDigits(form.elements.namedItem("zip_code"), 5);
  maskDigits(form.elements.namedItem("ssn_last4"), 4);
  maskDigits(form.elements.namedItem("clientSsnLast4"), 4);
  maskPhone(form.elements.namedItem("cell_phone"));
  maskPhone(form.elements.namedItem("home_phone"));
  maskPhone(form.elements.namedItem("clientPhone"));
  maskPhone(form.elements.namedItem("clientPhoneNumber"));
};

logoutBtn.addEventListener("click", () => {
  clearEmployeeId();
  clearCurrentClientKey();
  clearAuthenticated();
  showLogin();
});

loadState();
loadAuth();

const langSelect = document.getElementById("langSelect");
if (langSelect) {
  langSelect.value = getLanguage();
  langSelect.addEventListener("change", () => {
    setLanguage(langSelect.value);
    updateHeaderLabels();
    if (isAuthenticated()) {
      showForms();
    } else {
      showLogin();
    }
  });
}

updateHeaderLabels();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Service worker is optional; ignore if it fails.
    });
  });
}

if (isAuthenticated()) {
  showForms();
} else {
  showLogin();
}


