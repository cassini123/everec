// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
  };
};

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
};
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
};
var handleParsingNestedValues = (form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path8) => {
  const paths = path8.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path: path8 } = extractGroupsFromPath(routePath);
  const paths = splitPath(path8);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path8) => {
  const groups = [];
  path8 = path8.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path: path8 };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path8 = url.slice(start, end);
      return tryDecodeURI(path8.includes("%25") ? path8.replace(/%25/g, "%2525") : path8);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path8) => {
  if (path8.charCodeAt(path8.length - 1) !== 63 || !path8.includes(":")) {
    return null;
  }
  const segments = path8.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var _decodeURI = (value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
};
var _getQueryParam = (url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = (str) => tryDecode(str, decodeURIComponent_);
var HonoRequest = class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path8 = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path8;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path8, ...handlers) => {
      for (const p of [path8].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path8, app4) {
    const subApp = this.basePath(path8);
    app4.routes.map((r) => {
      let handler;
      if (app4.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app4.errorHandler)(c, () => r.handler(c, next))).res;
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path8) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path8);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path8, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = (request) => request;
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path8);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    };
    this.#addRoute(METHOD_NAME_ALL, mergePath(path8, "*"), handler);
    return this;
  }
  #addRoute(method, path8, handler, baseRoutePath) {
    method = method.toUpperCase();
    path8 = mergePath(this._basePath, path8);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path: path8,
      method,
      handler
    };
    this.router.add(method, path8, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path8 = this.getPath(request, { env });
    const matchResult = this.router.match(method, path8);
    const c = new Context(request, {
      path: path8,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path8) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path22) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path22];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path22.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path8);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path8, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path8 = path8.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path8.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path8) {
  return wildcardRegExpCache[path8] ??= new RegExp(
    path8 === "*" ? "" : `^${path8.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path8, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path8] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path8, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path8) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
function findMiddleware(middleware, path8) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path8)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path8, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path8 === "/*") {
      path8 = "*";
    }
    const paramCount = (path8.match(/\/:/g) || []).length;
    if (/\*$/.test(path8)) {
      const re = buildWildcardRegExp(path8);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path8] ||= findMiddleware(middleware[m], path8) || findMiddleware(middleware[METHOD_NAME_ALL], path8) || [];
        });
      } else {
        middleware[method][path8] ||= findMiddleware(middleware[method], path8) || findMiddleware(middleware[METHOD_NAME_ALL], path8) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path8) || [path8];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path22 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path22] ||= [
            ...findMiddleware(middleware[m], path22) || findMiddleware(middleware[METHOD_NAME_ALL], path22) || []
          ];
          routes[m][path22].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path8) => [path8, r[method][path8]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path8) => [path8, r[METHOD_NAME_ALL][path8]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path8, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path8, handler]);
  }
  match(method, path8) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path8);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = (children) => {
  for (const _ in children) {
    return true;
  }
  return false;
};
var Node2 = class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path8, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path8);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path8) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path8);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path8[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path8.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path8, handler) {
    const results = checkOptionalParameter(path8);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path8, handler);
  }
  match(method, path8) {
    return this.#node.search(method, path8);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = (options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        if (opts.credentials) {
          return (origin) => origin || null;
        }
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*" || opts.credentials) {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*" || opts.credentials) {
      c.header("Vary", "Origin", { append: true });
    }
  };
};

// desound/web/backend/src/app.ts
import fs2 from "node:fs";
import path2 from "node:path";

// shared/src/constants.ts
var USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// shared/src/knowgo/urlParse.ts
var MOBILE_USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
var URL_IN_TEXT_RE = /https?:\/\/[^\s<>"'`，。；！？、【】《》]+/i;
function detectPlatform(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("bilibili") || host === "b23.tv") return "bilibili";
    if (host.includes("douyin") || host.includes("tiktok") || host.includes("iesdouyin")) return "douyin";
    if (host.includes("xiaohongshu") || host.includes("xhslink")) return "xiaohongshu";
    if (host.includes("youtube") || host.includes("youtu.be")) return "youtube";
    if (host.includes("vimeo")) return "vimeo";
    if (host.includes("behance")) return "behance";
    if (host.includes("pinterest")) return "pinterest";
    if (host.includes("instagram")) return "instagram";
    return host;
  } catch {
    return "unknown";
  }
}
function extractUrlFromText(input) {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return normalizeUrl(trimmed);
  const match2 = trimmed.match(URL_IN_TEXT_RE);
  return match2 ? normalizeUrl(match2[0]) : trimmed;
}
function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:") {
      const host = parsed.hostname.replace(/^www\./, "");
      if (host === "xhslink.com" || host.endsWith(".xhslink.com") || host === "b23.tv") {
        parsed.protocol = "https:";
        return parsed.toString();
      }
    }
    return url;
  } catch {
    return url;
  }
}
async function fetchJson(url, referer) {
  const headers = { "User-Agent": USER_AGENT };
  if (referer) headers.Referer = referer;
  const res = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(12e3) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function fetchHtml(url, userAgent = USER_AGENT) {
  const res = await fetch(url, {
    headers: { "User-Agent": userAgent, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(15e3)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { html: await res.text(), finalUrl: res.url || url };
}
function extractMeta(html, property) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i")
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }
  return void 0;
}
function extractTitle(html) {
  const og = extractMeta(html, "og:title");
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : void 0;
}
function decodeHtmlEntities(text) {
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function deepGet(data, keys) {
  let current = data;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return void 0;
    if (typeof key === "number") {
      if (Array.isArray(current)) {
        current = current[key];
      } else {
        const values = Object.values(current);
        current = values.at(key);
      }
    } else {
      current = current[key];
    }
  }
  return current;
}
function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function extractInitialState(html) {
  const match2 = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*<\/script>/);
  if (!match2?.[1]) return void 0;
  try {
    const jsonText = match2[1].replace(/\bundefined\b/g, "null");
    return JSON.parse(jsonText);
  } catch {
    return void 0;
  }
}
function extractXhsNote(state) {
  return asRecord(deepGet(state, ["noteData", "data", "noteData"])) ?? asRecord(deepGet(state, ["note", "noteDetailMap", -1, "note"]));
}
function extractXhsCover(note) {
  const list = note.imageList;
  if (!Array.isArray(list) || !list.length) return void 0;
  const img = asRecord(list[0]);
  const url = img?.urlDefault ?? img?.url;
  return typeof url === "string" && url ? url : void 0;
}
function extractXhsVideoUrl(note) {
  const stream = asRecord(asRecord(asRecord(note.video)?.media)?.stream);
  if (!stream) return void 0;
  for (const codec of ["h264", "h265", "h266", "av1"]) {
    const entries = stream[codec];
    if (!Array.isArray(entries) || !entries.length) continue;
    const url = asRecord(entries[0])?.masterUrl;
    if (typeof url === "string" && url) return url;
  }
  return void 0;
}
function extractBvid(url) {
  const match2 = url.match(/BV[a-zA-Z0-9]+/);
  return match2 ? match2[0] : null;
}
async function parseBilibili(url) {
  const bvid = extractBvid(url);
  if (!bvid) throw new Error("\u65E0\u6CD5\u8BC6\u522B Bilibili \u89C6\u9891\u94FE\u63A5");
  const info = await fetchJson(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
    "https://www.bilibili.com"
  );
  if (info.code !== 0) throw new Error(info.message ?? "Bilibili API \u9519\u8BEF");
  const data = info.data ?? {};
  const owner = asRecord(data.owner);
  return {
    url,
    resolvedUrl: `https://www.bilibili.com/video/${bvid}`,
    title: String(data.title ?? "Bilibili \u89C6\u9891"),
    description: String(data.desc ?? ""),
    imageUrl: data.pic ? String(data.pic) : void 0,
    siteName: "\u54D4\u54E9\u54D4\u54E9",
    platform: "bilibili",
    author: owner?.name ? String(owner.name) : void 0,
    durationSec: Number(data.duration ?? 0) || void 0,
    mediaType: "video"
  };
}
async function parseXiaohongshu(url) {
  const { html, finalUrl } = await fetchHtml(url, MOBILE_USER_AGENT);
  const state = extractInitialState(html);
  const note = state ? extractXhsNote(state) : void 0;
  if (note) {
    const title2 = String(note.title ?? note.desc ?? "\u5C0F\u7EA2\u4E66\u4F5C\u54C1").trim();
    const description2 = String(note.desc ?? "").trim();
    const imageUrl = extractXhsCover(note) ?? extractMeta(html, "og:image");
    const videoUrl = extractXhsVideoUrl(note);
    const user = asRecord(note.user);
    const author = user?.nickname ? String(user.nickname) : user?.nickName ? String(user.nickName) : void 0;
    const noteType = String(note.type ?? "");
    const mediaType = noteType === "video" || videoUrl ? "video" : noteType === "normal" ? "image" : "article";
    return {
      url,
      resolvedUrl: finalUrl,
      title: title2,
      description: description2,
      imageUrl,
      videoUrl,
      siteName: "\u5C0F\u7EA2\u4E66",
      platform: "xiaohongshu",
      author,
      mediaType
    };
  }
  const poster = html.match(/id="video_note_poster"[^>]+src="([^"]+)"/i)?.[1];
  const title = extractTitle(html) ?? extractMeta(html, "twitter:title") ?? "\u5C0F\u7EA2\u4E66\u4F5C\u54C1";
  const description = extractMeta(html, "og:description") ?? extractMeta(html, "description") ?? extractMeta(html, "twitter:description") ?? "";
  return {
    url,
    resolvedUrl: finalUrl,
    title,
    description,
    imageUrl: poster ?? extractMeta(html, "og:image"),
    siteName: "\u5C0F\u7EA2\u4E66",
    platform: "xiaohongshu",
    mediaType: poster ? "video" : "article"
  };
}
async function parseDouyin(url) {
  const { html, finalUrl } = await fetchHtml(url, MOBILE_USER_AGENT);
  const title = extractTitle(html) ?? extractMeta(html, "twitter:title");
  const description = extractMeta(html, "og:description") ?? extractMeta(html, "description") ?? extractMeta(html, "twitter:description") ?? "";
  const imageUrl = extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image");
  const renderDataMatch = html.match(/<script id="RENDER_DATA" type="application\/json">([^<]+)<\/script>/i);
  if (renderDataMatch?.[1]) {
    try {
      const decoded = decodeURIComponent(renderDataMatch[1]);
      const data = JSON.parse(decoded);
      const detail = asRecord(deepGet(data, ["app", "videoDetail"]));
      if (detail) {
        const video = asRecord(detail.video);
        const playAddr = asRecord(video?.playAddr);
        const urlList = playAddr?.url_list;
        const videoUrl = Array.isArray(urlList) && typeof urlList[0] === "string" ? urlList[0] : void 0;
        const author = asRecord(detail.author);
        return {
          url,
          resolvedUrl: finalUrl,
          title: String(detail.desc ?? detail.title ?? title ?? "\u6296\u97F3\u4F5C\u54C1"),
          description: String(detail.desc ?? description),
          imageUrl: typeof video?.cover === "string" ? video.cover : imageUrl,
          videoUrl,
          siteName: "\u6296\u97F3",
          platform: "douyin",
          author: typeof author?.nickname === "string" ? author.nickname : void 0,
          mediaType: "video"
        };
      }
    } catch {
    }
  }
  if (title || imageUrl) {
    return {
      url,
      resolvedUrl: finalUrl,
      title: title ?? "\u6296\u97F3\u4F5C\u54C1",
      description,
      imageUrl,
      siteName: "\u6296\u97F3",
      platform: "douyin",
      mediaType: imageUrl ? "video" : "article"
    };
  }
  throw new Error("\u65E0\u6CD5\u89E3\u6790\u6296\u97F3\u94FE\u63A5");
}
async function parseGeneric(url, platform) {
  const { html, finalUrl } = await fetchHtml(url);
  const title = extractTitle(html) ?? extractMeta(html, "twitter:title") ?? "\u672A\u547D\u540D\u9875\u9762";
  const description = extractMeta(html, "og:description") ?? extractMeta(html, "description") ?? extractMeta(html, "twitter:description") ?? "";
  const imageUrl = extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image");
  const siteName = extractMeta(html, "og:site_name");
  return { url, resolvedUrl: finalUrl, title, description, imageUrl, siteName, platform, mediaType: "article" };
}
function fallbackUrlParse(url, platform, message) {
  let title = url;
  try {
    const u = new URL(url);
    title = u.hostname + u.pathname.slice(0, 40);
  } catch {
  }
  return {
    url,
    title,
    description: message ?? "\u65E0\u6CD5\u6293\u53D6\u9875\u9762\u8BE6\u60C5\uFF0C\u5DF2\u4FDD\u5B58\u94FE\u63A5\u4F9B\u540E\u7EED\u5206\u6790",
    platform,
    mediaType: "article"
  };
}
async function parseWebUrl(input) {
  const url = extractUrlFromText(input);
  const platform = detectPlatform(url);
  try {
    if (platform === "bilibili") return await parseBilibili(url);
    if (platform === "xiaohongshu") return await parseXiaohongshu(url);
    if (platform === "douyin") return await parseDouyin(url);
    return await parseGeneric(url, platform);
  } catch (err) {
    if (platform === "bilibili" || platform === "xiaohongshu" || platform === "douyin") {
      try {
        return await parseGeneric(url, platform);
      } catch {
        return fallbackUrlParse(url, platform, err instanceof Error ? err.message : void 0);
      }
    }
    return fallbackUrlParse(url, platform);
  }
}

// shared/src/library/parseTitle.ts
function splitQuery(query) {
  const q = query.trim();
  if (!q) return { title: "", artist: "" };
  const titleWithLatinArtist = q.match(/^([\u4e00-\u9fff·]{2,10})\s+([\u4e00-\u9fffA-Za-z·]+)$/);
  if (titleWithLatinArtist && /[A-Za-z]/.test(titleWithLatinArtist[2])) {
    return { title: titleWithLatinArtist[1].trim(), artist: titleWithLatinArtist[2].trim() };
  }
  const cnFirst = q.match(/^([\u4e00-\u9fff·][\u4e00-\u9fffA-Za-z·]{0,12})\s+(.+)$/);
  if (cnFirst) return { artist: cnFirst[1].trim(), title: cnFirst[2].trim() };
  const titleFirst = q.match(/^([\u4e00-\u9fff·]{2,10})\s+([\u4e00-\u9fffA-Za-z·]{2,})$/);
  if (titleFirst) return { title: titleFirst[1].trim(), artist: titleFirst[2].trim() };
  const enLast = q.match(/^(.+?)\s+([\u4e00-\u9fff·][\u4e00-\u9fffA-Za-z·]{1,12})$/);
  if (enLast) return { artist: enLast[2].trim(), title: enLast[1].trim() };
  const enTitleCnArtist = q.match(/^([A-Za-z][A-Za-z0-9\s'.-]+)([\u4e00-\u9fff·][\u4e00-\u9fffA-Za-z·]{1,12})$/);
  if (enTitleCnArtist) {
    return { title: enTitleCnArtist[1].trim(), artist: enTitleCnArtist[2].trim() };
  }
  const cnArtistEnTitle = q.match(/^([\u4e00-\u9fff·][\u4e00-\u9fffA-Za-z·]{1,12})([A-Za-z].+)$/);
  if (cnArtistEnTitle) {
    return { artist: cnArtistEnTitle[1].trim(), title: cnArtistEnTitle[2].trim() };
  }
  if (!/\s/.test(q)) return { title: "", artist: q };
  return { title: q, artist: "" };
}
function extractQueryKeywords(query, hint) {
  const h = hint ?? splitQuery(query);
  const seen = /* @__PURE__ */ new Set();
  const add = (raw2) => {
    const norm = raw2.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, "").trim();
    if (norm.length > 1) seen.add(norm);
  };
  if (h.artist) add(h.artist);
  if (h.title) {
    add(h.title);
    for (const w of h.title.toLowerCase().split(/\s+/)) add(w);
  }
  for (const cn of query.match(/[\u4e00-\u9fff·][\u4e00-\u9fffA-Za-z·]{1,12}/g) ?? []) add(cn);
  for (const en of query.match(/[A-Za-z][A-Za-z0-9']*/g) ?? []) add(en);
  return [...seen];
}
function countKeywordMatches(item, keywords) {
  const blob = `${item.title}${item.artist}${item.album ?? ""}`.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, "");
  let count = 0;
  for (const kw of keywords) {
    if (blob.includes(kw)) count++;
  }
  return count;
}
function cleanSongTitle(title) {
  return title.replace(/^[\s《》「」"']+|[\s《》「」"']+$/g, "").replace(/^\d{4,}\s*/, "").replace(/\s*[\-—–|·]\s*[\u4e00-\u9fff]{6,}.*$/, "").replace(/\s*\([^)]*$/, "").replace(/\s*（[^）]*$/, "").replace(/\s*(live|Live|LIVE|现场|版|cover|Cover).*$/, "").trim();
}
function cleanArtist(artist) {
  const a = artist.replace(/^[\s《》「」"'@]+|[\s《》「」"'@]+$/g, "").split(/[,、/|]/)[0].trim();
  return a || "\u672A\u77E5\u6B4C\u624B";
}
function normalizeSongTitle(title) {
  return cleanSongTitle(title).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, "").trim();
}
function songKey(title, artist, hint) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, "").trim();
  const t = normalizeSongTitle(title);
  if (hint?.title && normalizeSongTitle(hint.title) === t) return t;
  const a = norm(cleanArtist(artist));
  return `${t}|${a}`;
}
function isRemixOrLive(title) {
  return /\bdj\b/i.test(title) || /remix/i.test(title) || /\(.*版.*\)/.test(title) || /（.*版.*）/.test(title) || /\blive\b/i.test(title) || /现场/.test(title) || /cover/i.test(title);
}

// shared/src/library/search.ts
async function fetchJson2(url, referer) {
  const headers = { "User-Agent": USER_AGENT };
  if (referer) headers.Referer = referer;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, { headers });
    if (res.status === 412 && attempt === 0) {
      await new Promise((r) => setTimeout(r, 400));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  throw new Error("HTTP 412");
}
function scoreCandidate(query, item, keywords) {
  let score = countKeywordMatches(item, keywords) * 200;
  const qt = normalizeSongTitle(query.title);
  const qa = query.artist.toLowerCase().replace(/\s/g, "");
  const title = normalizeSongTitle(item.title);
  const artist = item.artist.toLowerCase().replace(/\s/g, "");
  const titleHit = !!(qt && (title === qt || title.includes(qt) || qt.includes(title)));
  const artistHit = !!(qa && artist.includes(qa));
  if (titleHit && artistHit) score += 300;
  else if (titleHit) score += 80;
  else if (artistHit) score += 80;
  if (qa && !artistHit) score -= 120;
  if (item.album) score += 20;
  if (item.previewUrl) score += 10;
  if (item.album && !/live|现场/i.test(item.album)) score += 15;
  if (isRemixOrLive(item.title) && !/live|版|dj|remix/i.test(query.title + query.artist)) score -= 60;
  if (item.album && /live|现场/i.test(item.album) && !/live|现场/i.test(query.title + query.artist)) {
    score -= 50;
  }
  if (/\([^)]*$/.test(item.title) || /（[^）]*$/.test(item.title)) score -= 20;
  if (item.durationMs > 0) score += 5;
  return score;
}
function isRelevantResult(item, query) {
  const hintTitle = normalizeSongTitle(query.title);
  const hintArtist = query.artist.toLowerCase().replace(/\s/g, "");
  if (!hintTitle && hintArtist) {
    const artist = item.artist.toLowerCase().replace(/\s/g, "");
    return artist.includes(hintArtist);
  }
  if (!hintTitle) return true;
  const itemTitle = normalizeSongTitle(item.title);
  if (itemTitle === hintTitle || itemTitle.includes(hintTitle) || hintTitle.includes(itemTitle)) {
    return true;
  }
  const words = query.title.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z0-9\u4e00-\u9fff]/g, "")).filter((w) => w.length > 1);
  if (words.length >= 2) {
    const blob = normalizeSongTitle(`${item.title}${item.artist}${item.album ?? ""}`);
    return words.every((w) => blob.includes(w));
  }
  return false;
}
function mergeResult(base, other) {
  return {
    ...base,
    album: base.album || other.album,
    coverUrl: base.coverUrl || other.coverUrl,
    previewUrl: base.previewUrl || other.previewUrl,
    durationMs: base.durationMs || other.durationMs
  };
}
function itunesArtworkUrl(raw2) {
  const url = raw2 ? String(raw2) : "";
  if (!url) return void 0;
  return url.replace(/(\d+)x\1bb\.(jpg|png)/i, "600x600bb.$2");
}
async function searchItunes(query, limit, _hint) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=${limit}&country=CN`;
  const data = await fetchJson2(url);
  const results = [];
  for (const item of data.results ?? []) {
    const kind = String(item.kind ?? item.wrapperType ?? "");
    if (kind && !kind.includes("song") && kind !== "track") continue;
    const id = String(item.trackId ?? "");
    if (!id) continue;
    const title = cleanSongTitle(String(item.trackName ?? "Unknown"));
    const artist = cleanArtist(String(item.artistName ?? "Unknown"));
    const album = String(item.collectionName ?? "").trim();
    if (!album) continue;
    results.push({
      id: `itunes:${id}`,
      title,
      artist,
      album,
      durationMs: Number(item.trackTimeMillis ?? 0),
      previewUrl: item.previewUrl ? String(item.previewUrl) : void 0,
      coverUrl: itunesArtworkUrl(item.artworkUrl100 ?? item.artworkUrl60),
      source: "itunes"
    });
  }
  return results;
}
function dedupeOnePerSong(items, query, keywords) {
  const best = /* @__PURE__ */ new Map();
  for (const item of items) {
    const key = songKey(item.title, item.artist, query);
    const prev = best.get(key);
    if (!prev) {
      best.set(key, item);
      continue;
    }
    const merged = mergeResult(
      scoreCandidate(query, item, keywords) >= scoreCandidate(query, prev, keywords) ? item : prev,
      scoreCandidate(query, item, keywords) >= scoreCandidate(query, prev, keywords) ? prev : item
    );
    best.set(key, merged);
  }
  return [...best.values()].sort(
    (a, b) => scoreCandidate(query, b, keywords) - scoreCandidate(query, a, keywords)
  );
}
async function searchMusicOnline(query, limit = 20) {
  const q = query.trim();
  if (!q) throw new Error("\u8BF7\u8F93\u5165\u641C\u7D22\u5173\u952E\u8BCD");
  const hint = splitQuery(q);
  const keywords = extractQueryKeywords(q, hint);
  const searchTerm = hint.artist && hint.title ? `${hint.artist} ${hint.title}`.trim() : hint.artist || hint.title || q;
  const [broad, focused] = await Promise.all([
    searchItunes(q, limit * 3, hint).catch(() => []),
    searchTerm !== q ? searchItunes(searchTerm, limit * 3, hint).catch(() => []) : Promise.resolve([])
  ]);
  const itunes = [...focused, ...broad];
  const merged = dedupeOnePerSong(itunes, hint, keywords);
  const relevant = merged.filter((item) => isRelevantResult(item, hint));
  const picked = (relevant.length ? relevant : merged).slice(0, limit);
  if (!picked.length) throw new Error("\u672A\u627E\u5230\u76F8\u5173\u6B4C\u66F2\uFF0C\u8BF7\u6362\u5173\u952E\u8BCD\u6216\u4E0A\u4F20\u672C\u5730\u6587\u4EF6");
  return picked;
}
function detectPlatform2(url) {
  const lower = url.toLowerCase();
  if (lower.includes("bilibili.com") || lower.includes("b23.tv")) return "bilibili";
  if (lower.includes("douyin.com") || lower.includes("iesdouyin.com")) return "douyin";
  if (lower.includes("xiaohongshu.com") || lower.includes("xhslink.com")) return "xiaohongshu";
  return null;
}
function extractBvid2(url) {
  const match2 = url.match(/BV[a-zA-Z0-9]+/);
  return match2 ? match2[0] : null;
}
async function parseBilibili2(url) {
  const bvid = extractBvid2(url);
  if (!bvid) throw new Error("\u65E0\u6CD5\u8BC6\u522B Bilibili \u89C6\u9891\u94FE\u63A5");
  const info = await fetchJson2(
    `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
    "https://www.bilibili.com"
  );
  if (info.code !== 0) throw new Error(info.message ?? "Bilibili API \u9519\u8BEF");
  const data = info.data;
  const cid = Number(data.cid);
  const play = await fetchJson2(
    `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&fnval=16&qn=0`,
    "https://www.bilibili.com"
  );
  const audio = play.data?.dash?.audio?.[0];
  return {
    platform: "bilibili",
    title: String(data.title ?? "Bilibili \u89C6\u9891"),
    author: String(data.owner?.name ?? ""),
    durationSec: Number(data.duration ?? 0),
    coverUrl: data.pic ? String(data.pic) : void 0,
    audioUrl: audio?.baseUrl ?? audio?.base_url,
    originalUrl: url
  };
}
function toLinkParseResult(parsed, originalUrl) {
  return {
    platform: parsed.platform,
    title: parsed.title,
    author: parsed.author ?? "",
    durationSec: parsed.durationSec ?? 0,
    coverUrl: parsed.imageUrl,
    audioUrl: parsed.videoUrl,
    originalUrl: parsed.resolvedUrl ?? originalUrl
  };
}
async function parseMediaUrl(url) {
  const trimmed = extractUrlFromText(url);
  if (!trimmed) throw new Error("\u8BF7\u8F93\u5165\u94FE\u63A5");
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    throw new Error("\u8BF7\u8F93\u5165\u6709\u6548\u7684 http/https \u94FE\u63A5");
  }
  const platform = detectPlatform2(trimmed);
  if (platform === "bilibili") {
    try {
      return await parseBilibili2(trimmed);
    } catch {
      try {
        return toLinkParseResult(await parseWebUrl(trimmed), trimmed);
      } catch {
        return {
          platform: "bilibili",
          title: "Bilibili \u89C6\u9891",
          author: "",
          durationSec: 0,
          originalUrl: trimmed
        };
      }
    }
  }
  if (platform === "douyin" || platform === "xiaohongshu") {
    return toLinkParseResult(await parseWebUrl(trimmed), trimmed);
  }
  throw new Error("\u6682\u4E0D\u652F\u6301\u8BE5\u5E73\u53F0\uFF0C\u76EE\u524D\u652F\u6301: Bilibili\u3001\u6296\u97F3\u3001\u5C0F\u7EA2\u4E66");
}

// shared/src/library/resolve.ts
async function resolveMusicAudioUrl(result) {
  if (result.previewUrl) {
    return {
      url: result.previewUrl,
      ext: result.previewUrl.includes(".m4a") ? "m4a" : "mp3"
    };
  }
  throw new Error("\u6682\u65F6\u65E0\u6CD5\u89E3\u6790\u8BE5\u6B4C\u66F2\uFF0C\u8BF7\u6362\u4E00\u6761\u7ED3\u679C\u6216\u4E0A\u4F20\u672C\u5730\u6587\u4EF6");
}

// shared/src/library/sfxSearch.ts
var CN_QUERY_MAP = {
  \u6811\u6728\u838E\u838E: "tree leaves rustling wind",
  \u6811\u6728: "tree wind forest",
  \u838E\u838E: "rustling leaves",
  \u70B9\u8D5E: "like button click social",
  \u70B9\u51FB: "ui click button",
  \u6309\u94AE: "button click ui",
  \u96E8: "rain ambience",
  \u96F7\u58F0: "thunder",
  \u811A\u6B65: "footsteps walking",
  \u5F00\u95E8: "door open creak",
  \u7206\u70B8: "explosion impact",
  _whoosh: "whoosh swoosh"
};
var CURATED_SFX = [
  {
    id: "mixkit:like",
    title: "\u70B9\u8D5E \xB7 \u6E05\u8106\u63D0\u793A",
    previewUrl: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    source: "mixkit"
  },
  {
    id: "mixkit:click",
    title: "\u70B9\u51FB \xB7 UI \u6309\u94AE",
    previewUrl: "https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3",
    source: "mixkit"
  },
  {
    id: "mixkit:wind-leaves",
    title: "\u6811\u6728\u838E\u838E \xB7 \u98CE\u5439\u6811\u53F6",
    previewUrl: "https://assets.mixkit.co/active_storage/sfx/1209/1209-preview.mp3",
    source: "mixkit"
  },
  {
    id: "mixkit:forest",
    title: "\u68EE\u6797 \xB7 \u73AF\u5883\u98CE\u58F0",
    previewUrl: "https://assets.mixkit.co/active_storage/sfx/1210/1210-preview.mp3",
    source: "mixkit"
  },
  {
    id: "mixkit:notification",
    title: "\u901A\u77E5 \xB7 \u77ED\u4FC3\u63D0\u793A\u97F3",
    previewUrl: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
    source: "mixkit"
  }
];
function expandQuery(query) {
  const q = query.trim();
  if (!q) return "";
  for (const [cn, en] of Object.entries(CN_QUERY_MAP)) {
    if (q.includes(cn)) return `${q} ${en}`;
  }
  return q;
}
function scoreSfx(query, item) {
  const q = query.toLowerCase().replace(/\s/g, "");
  const blob = `${item.title}${item.id}`.toLowerCase().replace(/\s/g, "");
  let score = 0;
  for (const token of query.split(/\s+/)) {
    const t = token.trim().toLowerCase();
    if (t.length > 1 && blob.includes(t.replace(/\s/g, ""))) score += 10;
  }
  if (blob.includes(q)) score += 50;
  for (const cn of Object.keys(CN_QUERY_MAP)) {
    if (query.includes(cn) && item.title.includes(cn.split("").slice(0, 2).join(""))) score += 20;
  }
  return score;
}
async function searchWikimedia(query, limit) {
  const searchTerm = expandQuery(query);
  const url = "https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `filetype:audio ${searchTerm}`,
    gsrnamespace: "6",
    prop: "imageinfo",
    iiprop: "url|mime|size",
    gsrlimit: String(limit),
    format: "json",
    origin: "*"
  });
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return [];
  const data = await res.json();
  const results = [];
  for (const page of Object.values(data.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    const fileUrl = info?.url;
    if (!fileUrl || !info.mime?.startsWith("audio")) continue;
    const title = (page.title ?? "Sound").replace(/^File:/, "").replace(/\.[^.]+$/, "");
    results.push({
      id: `wikimedia:${encodeURIComponent(title)}`,
      title,
      previewUrl: fileUrl,
      source: "wikimedia"
    });
  }
  return results;
}
async function searchSfxOnline(query, limit = 12) {
  const q = query.trim();
  if (!q) throw new Error("\u8BF7\u8F93\u5165\u97F3\u6548\u5173\u952E\u8BCD");
  const curated = CURATED_SFX.filter((item) => scoreSfx(q, item) > 0 || q.length <= 4).sort((a, b) => scoreSfx(q, b) - scoreSfx(q, a));
  const remote = await searchWikimedia(q, limit).catch(() => []);
  const merged = [...curated, ...remote];
  const seen = /* @__PURE__ */ new Set();
  const unique = [];
  for (const item of merged.sort((a, b) => scoreSfx(q, b) - scoreSfx(q, a))) {
    if (seen.has(item.previewUrl)) continue;
    seen.add(item.previewUrl);
    unique.push(item);
    if (unique.length >= limit) break;
  }
  if (!unique.length) throw new Error("\u672A\u627E\u5230\u76F8\u5173\u97F3\u6548\uFF0C\u8BF7\u6362\u5173\u952E\u8BCD");
  return unique;
}

// shared/src/knowgo/types.ts
var DEFAULT_BRIEF = {
  title: "",
  client: "",
  objective: "",
  audience: "",
  tone: "",
  duration: "",
  references: "",
  constraints: "",
  deliverables: ""
};
var DEFAULT_STYLE_GUIDE = {
  keywords: [],
  moodTags: [],
  fonts: [],
  posterStyle: {
    layout: "",
    colorScheme: [],
    typography: "",
    composition: "",
    referenceDescription: ""
  },
  vfxRecommendations: [],
  similarShorts: []
};
var DEFAULT_DOCUMENT = {
  title: "\u7075\u611F\u5206\u6790\u6587\u6863",
  sections: [
    { id: "overview", heading: "\u9879\u76EE\u6982\u8FF0", content: "", mediaIds: [] },
    { id: "inspiration", heading: "\u7075\u611F\u6765\u6E90", content: "", mediaIds: [] },
    { id: "visual", heading: "\u89C6\u89C9\u8BED\u8A00", content: "", mediaIds: [] },
    { id: "implementation", heading: "\u5B9E\u73B0\u65B9\u6848", content: "", mediaIds: [] }
  ],
  updatedAt: (/* @__PURE__ */ new Date()).toISOString()
};

// shared/src/knowgo/analyzeLocal.ts
var ART_STYLES = [
  "\u8D5B\u535A\u670B\u514B\u9713\u8679",
  "\u6781\u7B80\u4E3B\u4E49",
  "\u80F6\u7247\u590D\u53E4",
  "\u9AD8\u9971\u548C\u6CE2\u666E",
  "\u4F4E\u9971\u548C\u83AB\u5170\u8FEA",
  "\u7EAA\u5F55\u7247\u624B\u6301",
  "\u5546\u4E1A\u5E7F\u544A\u7CBE\u81F4",
  "\u65E5\u7CFB\u6E05\u65B0",
  "\u9ED1\u8272\u7535\u5F71",
  "\u8D85\u73B0\u5B9E\u4E3B\u4E49"
];
var FILM_STYLES = [
  "\u53D9\u4E8B\u578B\u54C1\u724C\u77ED\u7247",
  "\u8282\u594F\u578B\u5361\u70B9 MV",
  "\u7EAA\u5F55\u7247\u89C2\u5BDF\u5F0F",
  "\u5B9E\u9A8C\u5F71\u50CF",
  "\u4EA7\u54C1\u5C55\u793A\u5E7F\u544A",
  "\u60C5\u7EEA\u6C1B\u56F4\u7247",
  "Vlog \u53D9\u4E8B",
  "\u52A8\u753B\u6DF7\u5408\u5B9E\u62CD"
];
var SHOT_TYPES = [
  "\u5927\u8FDC\u666F EWS",
  "\u8FDC\u666F WS",
  "\u5168\u666F FS",
  "\u4E2D\u666F MS",
  "\u8FD1\u666F CU",
  "\u7279\u5199 ECU",
  "\u8FC7\u80A9 OTS",
  "\u822A\u62CD Aerial"
];
var SIMILAR_SHORTS = [
  {
    id: "s1",
    title: "Her",
    director: "Spike Jonze",
    year: "2013",
    styleTags: ["\u6781\u7B80", "\u6696\u8272\u8C03", "\u8FD1\u666F\u53D9\u4E8B"],
    previewUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop",
    linkUrl: "https://www.youtube.com/results?search_query=Her+2013+trailer",
    similarity: 0.88
  },
  {
    id: "s2",
    title: "Blade Runner 2049",
    director: "Denis Villeneuve",
    year: "2017",
    styleTags: ["\u8D5B\u535A\u670B\u514B", "\u4F4E\u9971\u548C", "\u5927\u6784\u56FE"],
    previewUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=225&fit=crop",
    linkUrl: "https://www.youtube.com/results?search_query=Blade+Runner+2049+cinematography",
    similarity: 0.82
  },
  {
    id: "s3",
    title: "Apple \u2014 Shot on iPhone",
    director: "Various",
    year: "2024",
    styleTags: ["\u5546\u4E1A\u5E7F\u544A", "\u624B\u6301", "\u81EA\u7136\u5149"],
    previewUrl: "https://images.unsplash.com/photo-1611162617474-5b21e939e071?w=400&h=225&fit=crop",
    linkUrl: "https://www.youtube.com/results?search_query=Apple+Shot+on+iPhone+commercial",
    similarity: 0.79
  },
  {
    id: "s4",
    title: "Everything Everywhere All at Once",
    director: "Daniels",
    year: "2022",
    styleTags: ["\u8D85\u73B0\u5B9E", "\u5FEB\u5207", "\u9AD8\u9971\u548C"],
    previewUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=225&fit=crop",
    linkUrl: "https://www.youtube.com/results?search_query=Everything+Everywhere+trailer",
    similarity: 0.75
  }
];
var FONT_POOL = [
  {
    name: "Inter",
    category: "\u65E0\u886C\u7EBF / \u73B0\u4EE3",
    usage: "\u6807\u9898\u4E0E UI\uFF0C\u6E05\u6670\u4E13\u4E1A",
    previewText: "KNOWGO \u7075\u611F\u5206\u6790",
    googleFontUrl: "https://fonts.google.com/specimen/Inter",
    cssFamily: "'Inter', sans-serif"
  },
  {
    name: "Playfair Display",
    category: "\u886C\u7EBF / \u4F18\u96C5",
    usage: "\u54C1\u724C\u6807\u9898\u3001\u6D77\u62A5\u4E3B\u6807\u9898",
    previewText: "Creative Vision",
    googleFontUrl: "https://fonts.google.com/specimen/Playfair+Display",
    cssFamily: "'Playfair Display', serif"
  },
  {
    name: "Space Grotesk",
    category: "\u65E0\u886C\u7EBF / \u79D1\u6280",
    usage: "\u8D5B\u535A/\u79D1\u6280\u98CE\u683C\u6807\u9898",
    previewText: "NEON DISTRICT",
    googleFontUrl: "https://fonts.google.com/specimen/Space+Grotesk",
    cssFamily: "'Space Grotesk', sans-serif"
  },
  {
    name: "Noto Sans SC",
    category: "\u65E0\u886C\u7EBF / \u4E2D\u6587",
    usage: "\u4E2D\u6587\u6B63\u6587\u4E0E\u5B57\u5E55",
    previewText: "\u6BCF\u523B\u521B\u4F5C \xB7 \u98CE\u683C\u89E3\u6790",
    googleFontUrl: "https://fonts.google.com/noto/specimen/Noto+Sans+SC",
    cssFamily: "'Noto Sans SC', sans-serif"
  }
];
var VFX_POOL = [
  {
    name: "\u80F6\u7247\u9897\u7C92 + \u6697\u89D2",
    description: "\u53E0\u52A0 35mm \u9897\u7C92\u4E0E\u8F7B\u5FAE\u6697\u89D2\uFF0C\u8425\u9020\u590D\u53E4\u80F6\u7247\u8D28\u611F",
    tools: ["DaVinci Resolve", "After Effects", "FilmConvert"],
    referenceImageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=250&fit=crop",
    difficulty: "easy"
  },
  {
    name: "\u9713\u8679\u5149\u6655",
    description: "\u9AD8\u9971\u548C\u8FB9\u7F18\u53D1\u5149\uFF0C\u9002\u5408\u8D5B\u535A\u670B\u514B/\u591C\u666F\u57CE\u5E02",
    tools: ["After Effects", "Blender Compositor"],
    referenceImageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=250&fit=crop",
    difficulty: "medium"
  },
  {
    name: "\u901F\u5EA6 ramp \u5361\u70B9",
    description: "\u914D\u5408\u97F3\u4E50\u8282\u62CD\u7684\u901F\u5EA6\u66F2\u7EBF\u53D8\u901F\uFF0C\u5F3A\u5316\u8282\u594F\u611F",
    tools: ["Premiere Pro", "DaVinci Resolve", "Final Cut Pro"],
    referenceImageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=250&fit=crop",
    difficulty: "medium"
  },
  {
    name: "\u906E\u7F69\u8F6C\u573A",
    description: "\u56FE\u5F62\u906E\u7F69\u6216\u7269\u4F53\u8FD0\u52A8\u9A71\u52A8\u7684\u521B\u610F\u8F6C\u573A",
    tools: ["After Effects", "CapCut Pro"],
    referenceImageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=250&fit=crop",
    difficulty: "hard"
  }
];
function hashSeed(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = h * 31 + text.charCodeAt(i) >>> 0;
  return h;
}
function pick(arr, seed, offset = 0) {
  return arr[(seed + offset) % arr.length];
}
function analyzeImageLocal(captureId, hint = "") {
  const seed = hashSeed(hint || captureId);
  const artStyle = pick(ART_STYLES, seed);
  const palettes = [
    ["#1a1a2e", "#16213e", "#0f3460", "#e94560"],
    ["#2d3436", "#636e72", "#b2bec3", "#dfe6e9"],
    ["#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1"],
    ["#2c003e", "#512b58", "#fe346e", "#ffdde1"]
  ];
  return {
    captureId,
    subject: hint.includes("\u4EBA") ? "\u4EBA\u7269\u4E3B\u4F53\u4E0E\u60C5\u7EEA\u8868\u8FBE" : "\u573A\u666F\u6784\u56FE\u4E0E\u89C6\u89C9\u7126\u70B9",
    composition: pick(
      ["\u4E09\u5206\u6CD5\u6784\u56FE", "\u4E2D\u5FC3\u5BF9\u79F0", "\u5F15\u5BFC\u7EBF\u6784\u56FE", "\u6846\u4E2D\u6846", "\u8D1F\u7A7A\u95F4\u7559\u767D"],
      seed,
      1
    ),
    colorPalette: pick(palettes, seed, 2),
    artStyle,
    mood: pick(["\u5FE7\u90C1", "\u6D3B\u529B", "\u795E\u79D8", "\u6E29\u6696", "\u51B7\u5CFB", "\u68A6\u5E7B"], seed, 3),
    techniques: [
      pick(["\u81EA\u7136\u5149", "\u4FA7\u9006\u5149", "\u9713\u8679\u8865\u5149", "\u67D4\u5149\u7BB1"], seed, 4),
      pick(["\u6D45\u666F\u6DF1", "\u6DF1\u666F\u6DF1", "\u957F\u66DD\u5149", "\u9AD8\u901F\u5FEB\u95E8"], seed, 5),
      pick(["\u4F4E\u89D2\u5EA6", "\u4FEF\u62CD", "\u8377\u5170\u89D2", "\u5E73\u89C6"], seed, 6)
    ],
    implementation: {
      summary: `\u4EE5 ${artStyle} \u4E3A\u57FA\u8C03\uFF0C\u901A\u8FC7\u8272\u5F69\u4E0E\u6784\u56FE\u4F20\u8FBE\u60C5\u7EEA`,
      tools: ["DaVinci Resolve", "Lightroom", "Photoshop", "Capture One"],
      steps: [
        "\u5206\u6790\u53C2\u8003\u56FE\u8272\u6E29\u4E0E\u5BF9\u6BD4\u5EA6\u66F2\u7EBF",
        "\u5EFA\u7ACB LUT \u6216\u8272\u5F69\u8282\u70B9\u5339\u914D\u4E3B\u8272\u8C03",
        "\u8C03\u6574\u6784\u56FE\u88C1\u5207\u6BD4\u4F8B\uFF0816:9 / 2.39:1\uFF09",
        "\u6DFB\u52A0\u9897\u7C92/\u9510\u5316\u5B8C\u6210\u80F6\u7247\u6216\u5546\u4E1A\u8D28\u611F"
      ],
      difficulty: seed % 3 === 0 ? "hard" : seed % 2 === 0 ? "medium" : "easy"
    },
    source: "local"
  };
}
function analyzeVideoLocal(captureId, durationSec = 60, hint = "") {
  const seed = hashSeed(hint || captureId);
  const filmStyle = pick(FILM_STYLES, seed);
  const shotCount = Math.min(8, Math.max(3, Math.floor(durationSec / 8)));
  const shots = [];
  for (let i = 0; i < shotCount; i++) {
    const startSec = Math.round(durationSec / shotCount * i);
    const endSec = Math.round(durationSec / shotCount * (i + 1));
    shots.push({
      index: i + 1,
      startSec,
      endSec,
      durationSec: endSec - startSec,
      shotType: pick(SHOT_TYPES, seed, i),
      description: pick(
        [
          "\u5EFA\u7ACB\u73AF\u5883\u6C1B\u56F4",
          "\u5C55\u793A\u4E3B\u4F53\u7EC6\u8282",
          "\u60C5\u7EEA\u7279\u5199",
          "\u52A8\u4F5C/\u4EA7\u54C1\u5C55\u793A",
          "\u8F6C\u573A\u8FC7\u6E21",
          "\u9AD8\u6F6E\u89C6\u89C9",
          "\u6536\u5C3E\u7559\u767D"
        ],
        seed,
        i + 2
      ),
      cameraMovement: pick(
        ["\u56FA\u5B9A", "\u7F13\u6162\u63A8\u955C", "\u6A2A\u79FB", "\u624B\u6301\u8DDF\u62CD", "\u822A\u62CD\u4E0B\u964D", "\u73AF\u7ED5"],
        seed,
        i + 3
      ),
      implementation: pick(
        [
          "\u4E09\u811A\u67B6\u56FA\u5B9A + \u81EA\u7136\u5149",
          "\u6ED1\u8F68 50cm \u7F13\u63A8",
          "\u7A33\u5B9A\u5668\u624B\u6301\u8DDF\u62CD",
          "\u65E0\u4EBA\u673A\u822A\u62CD\u5EFA\u7ACB\u955C\u5934",
          "\u5347\u683C 120fps \u6162\u52A8\u4F5C"
        ],
        seed,
        i + 4
      ),
      thumbnailHint: `\u955C\u5934 ${i + 1} \xB7 ${startSec}s\u2013${endSec}s`
    });
  }
  const keywords = [
    filmStyle.split(" ")[0],
    pick(["\u6696\u8272\u8C03", "\u51B7\u8272\u8C03", "\u9AD8\u5BF9\u6BD4", "\u4F4E\u9971\u548C"], seed),
    pick(["\u5FEB\u5207", "\u957F\u955C\u5934", "\u6DF7\u5408\u8282\u594F"], seed, 1),
    pick(["\u624B\u6301", "\u7A33\u5B9A", "\u822A\u62CD"], seed, 2)
  ];
  return {
    captureId,
    filmStyle,
    pacing: pick(["\u5FEB\u8282\u594F\u5361\u70B9", "\u4E2D\u7B49\u53D9\u4E8B", "\u6162\u8282\u594F\u6C1B\u56F4"], seed),
    narrativeStructure: pick(
      ["\u4E09\u5E55\u5F0F", "\u73AF\u5F62\u7ED3\u6784", "\u5E73\u884C\u526A\u8F91", "\u5355\u573A\u666F\u60C5\u7EEA\u9012\u8FDB"],
      seed,
      1
    ),
    colorGrading: pick(
      ["Teal & Orange \u5546\u4E1A\u98CE", "\u4F4E\u9971\u548C\u80F6\u7247", "\u9AD8\u9971\u548C\u6CE2\u666E", "\u9ED1\u767D\u9AD8\u5BF9\u6BD4"],
      seed,
      2
    ),
    cameraLanguage: pick(
      ["\u4EE5\u8FD1\u666F\u60C5\u7EEA\u4E3A\u4E3B", "\u5927\u6784\u56FE\u5EFA\u7ACB\u7A7A\u95F4", "\u6DF7\u5408\u666F\u522B\u53D9\u4E8B"],
      seed,
      3
    ),
    shots,
    overallKeywords: keywords,
    source: "local"
  };
}
function buildStyleGuideLocal(hint = "", keywords = []) {
  const seed = hashSeed(hint + keywords.join(","));
  const mergedKeywords = keywords.length > 0 ? keywords : [
    pick(ART_STYLES, seed).slice(0, 4),
    pick(["\u60C5\u7EEA", "\u53D9\u4E8B", "\u5546\u4E1A", "\u5B9E\u9A8C"], seed, 1),
    pick(["\u6696\u8272", "\u51B7\u8272", "\u9AD8\u9971\u548C", "\u4F4E\u9971\u548C"], seed, 2)
  ];
  const posterStyle = {
    layout: pick(
      ["\u4E2D\u5FC3\u4E3B\u4F53 + \u5927\u6807\u9898", "\u4E09\u5206\u6CD5 + \u5E95\u90E8\u5B57\u5E55\u533A", "\u5168\u51FA\u8840\u80CC\u666F + \u5C0F\u5B57\u6807\u9898"],
      seed
    ),
    colorScheme: pick(
      [
        ["#0d0d0d", "#ff6b2c", "#e8e8ed"],
        ["#1a1a2e", "#4da3ff", "#3dd68c"],
        ["#2d3436", "#dfe6e9", "#636e72"]
      ],
      seed,
      1
    ),
    typography: `${pick(FONT_POOL, seed).name} + ${pick(FONT_POOL, seed, 1).name}`,
    composition: pick(["\u7559\u767D\u547C\u5438\u611F", "\u6EE1\u6784\u56FE\u51B2\u51FB", "\u5BF9\u89D2\u7EBF\u52A8\u6001"], seed, 2),
    referenceDescription: "\u53C2\u8003\u4E3B\u89C6\u89C9\u7684\u8272\u5757\u6BD4\u4F8B\u4E0E\u5B57\u4F53\u5C42\u7EA7\uFF0C\u4FDD\u6301\u54C1\u724C\u4E00\u81F4\u6027"
  };
  return {
    keywords: mergedKeywords,
    moodTags: [
      pick(["\u6E29\u6696", "\u51B7\u5CFB", "\u795E\u79D8", "\u6D3B\u529B"], seed),
      pick(["\u6000\u65E7", "\u672A\u6765", "\u81EA\u7136", "\u90FD\u5E02"], seed, 1)
    ],
    fonts: [pick(FONT_POOL, seed), pick(FONT_POOL, seed, 1), pick(FONT_POOL, seed, 2)],
    posterStyle,
    vfxRecommendations: [pick(VFX_POOL, seed), pick(VFX_POOL, seed, 1), pick(VFX_POOL, seed, 2)],
    similarShorts: SIMILAR_SHORTS.map((s, i) => ({
      ...s,
      similarity: Math.max(0.6, s.similarity - i * 0.03 + seed % 10 * 0.01)
    })).sort((a, b) => b.similarity - a.similarity)
  };
}

// node_modules/uuid/dist/esm/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// node_modules/uuid/dist/esm/rng.js
import { randomFillSync } from "crypto";
var rnds8Pool = new Uint8Array(256);
var poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

// node_modules/uuid/dist/esm/native.js
import { randomUUID } from "crypto";
var native_default = { randomUUID };

// node_modules/uuid/dist/esm/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default = v4;

// shared/src/knowgo/graphSync.ts
function createNode(projectId, type, label, props = {}, refId) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    id: v4_default(),
    projectId,
    type,
    label,
    props,
    refId,
    createdAt: now,
    updatedAt: now,
    version: 1
  };
}
function createEdge(projectId, from, to, type, props) {
  return {
    id: v4_default(),
    projectId,
    from,
    to,
    type,
    props,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function upsertNode(graph, node) {
  const idx = graph.nodes.findIndex(
    (n) => n.refId === node.refId && n.type === node.type && node.refId != null
  );
  if (idx >= 0) {
    const updated = {
      ...graph.nodes[idx],
      label: node.label,
      props: node.props,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      version: graph.nodes[idx].version + 1
    };
    const nodes = [...graph.nodes];
    nodes[idx] = updated;
    return {
      graph: { ...graph, nodes, updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
      node: updated
    };
  }
  return {
    graph: {
      ...graph,
      nodes: [...graph.nodes, node],
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    node
  };
}
function removeNodesByRef(graph, refId) {
  const removeIds = new Set(graph.nodes.filter((n) => n.refId === refId).map((n) => n.id));
  return {
    ...graph,
    nodes: graph.nodes.filter((n) => !removeIds.has(n.id)),
    edges: graph.edges.filter((e) => !removeIds.has(e.from) && !removeIds.has(e.to)),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function removeNodesByRefPrefix(graph, prefix) {
  const removeIds = new Set(
    graph.nodes.filter((n) => n.refId?.startsWith(prefix)).map((n) => n.id)
  );
  return {
    ...graph,
    nodes: graph.nodes.filter((n) => !removeIds.has(n.id)),
    edges: graph.edges.filter((e) => !removeIds.has(e.from) && !removeIds.has(e.to)),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function addEdgeIfMissing(graph, edge) {
  const exists = graph.edges.some(
    (e) => e.from === edge.from && e.to === edge.to && e.type === edge.type
  );
  if (exists) return graph;
  return {
    ...graph,
    edges: [...graph.edges, edge],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function initProjectGraph(projectId, title) {
  const projectNode = createNode(projectId, "Project", title || "\u672A\u547D\u540D\u9879\u76EE", {
    title
  });
  projectNode.refId = projectId;
  return {
    projectId,
    nodes: [projectNode],
    edges: [],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function getProjectRootNode(graph) {
  return graph.nodes.find((n) => n.type === "Project");
}
function syncBriefToGraph(graph, projectId, brief) {
  let g = graph;
  const root = getProjectRootNode(g);
  if (!root) return g;
  if (root.label !== brief.title) {
    g = upsertNode(g, { ...root, label: brief.title || root.label, props: { ...root.props, title: brief.title } }).graph;
  }
  const briefNode = createNode(projectId, "Brief", brief.title || "\u9879\u76EE Brief", { ...brief }, "brief");
  const { graph: g2, node: briefN } = upsertNode(g, briefNode);
  g = g2;
  g = addEdgeIfMissing(g, createEdge(projectId, briefN.id, root.id, "belongs_to"));
  g = addEdgeIfMissing(g, createEdge(projectId, briefN.id, root.id, "constrains"));
  return g;
}
function syncCaptureToGraph(graph, projectId, capture) {
  let g = graph;
  const root = getProjectRootNode(g);
  if (!root) return g;
  g = removeNodesByRef(g, capture.id);
  const assetNode = createNode(
    projectId,
    "Asset",
    capture.title,
    {
      type: capture.type,
      sourceUrl: capture.sourceUrl,
      fileName: capture.fileName,
      previewUrl: capture.previewUrl,
      platform: capture.platform,
      description: capture.description
    },
    capture.id
  );
  g = { ...g, nodes: [...g.nodes, assetNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, assetNode.id, root.id, "belongs_to"));
  return g;
}
function syncImageAnalysisToGraph(graph, projectId, captureId, analysis) {
  let g = graph;
  const asset = g.nodes.find((n) => n.refId === captureId && n.type === "Asset");
  if (!asset) return g;
  const analysisRef = `analysis-image-${captureId}`;
  g = removeNodesByRefPrefix(g, `analysis-image-${captureId}`);
  g = removeNodesByRefPrefix(g, `impl-image-${captureId}`);
  g = removeNodesByRefPrefix(g, `mood-${captureId}`);
  g = removeNodesByRefPrefix(g, `style-${captureId}`);
  g = removeNodesByRefPrefix(g, `palette-${captureId}`);
  const analysisNode = createNode(
    projectId,
    "Analysis",
    `\u56FE\u7247\u5206\u6790 \xB7 ${analysis.artStyle}`,
    { ...analysis, mediaType: "image" },
    analysisRef
  );
  g = { ...g, nodes: [...g.nodes, analysisNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, analysisNode.id, asset.id, "derived_from"));
  const implNode = createNode(
    projectId,
    "Implementation",
    analysis.implementation.summary.slice(0, 40),
    analysis.implementation,
    `impl-image-${captureId}`
  );
  g = { ...g, nodes: [...g.nodes, implNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, implNode.id, analysisNode.id, "implements"));
  const moodNode = createNode(projectId, "Mood", analysis.mood, {}, `mood-${captureId}`);
  g = { ...g, nodes: [...g.nodes, moodNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, moodNode.id, analysisNode.id, "evidences"));
  const styleNode = createNode(
    projectId,
    "StyleTag",
    analysis.artStyle,
    { techniques: analysis.techniques },
    `style-${captureId}`
  );
  g = { ...g, nodes: [...g.nodes, styleNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, styleNode.id, analysisNode.id, "evidences"));
  const paletteNode = createNode(
    projectId,
    "ColorPalette",
    analysis.colorPalette.join(", ").slice(0, 32),
    { colors: analysis.colorPalette },
    `palette-${captureId}`
  );
  g = { ...g, nodes: [...g.nodes, paletteNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, paletteNode.id, analysisNode.id, "evidences"));
  return g;
}
function syncVideoAnalysisToGraph(graph, projectId, captureId, analysis) {
  let g = graph;
  const asset = g.nodes.find((n) => n.refId === captureId && n.type === "Asset");
  if (!asset) return g;
  const analysisRef = `analysis-video-${captureId}`;
  g = removeNodesByRefPrefix(g, `analysis-video-${captureId}`);
  g = removeNodesByRefPrefix(g, `shot-${captureId}-`);
  g = removeNodesByRefPrefix(g, `vkw-${captureId}-`);
  const analysisNode = createNode(
    projectId,
    "Analysis",
    `\u89C6\u9891\u5206\u6790 \xB7 ${analysis.filmStyle}`,
    { ...analysis, mediaType: "video" },
    analysisRef
  );
  g = { ...g, nodes: [...g.nodes, analysisNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, analysisNode.id, asset.id, "derived_from"));
  for (const shot of analysis.shots) {
    const shotRef = `shot-${captureId}-${shot.index}`;
    const shotNode = createNode(projectId, "Shot", `\u955C\u5934 #${shot.index}`, shot, shotRef);
    g = { ...g, nodes: [...g.nodes, shotNode] };
    g = addEdgeIfMissing(g, createEdge(projectId, shotNode.id, asset.id, "shot_of"));
    g = addEdgeIfMissing(g, createEdge(projectId, shotNode.id, analysisNode.id, "derived_from"));
  }
  for (const kw of analysis.overallKeywords) {
    const tagRef = `vkw-${captureId}-${kw}`;
    const tagNode = createNode(projectId, "StyleTag", kw, {}, tagRef);
    g = { ...g, nodes: [...g.nodes, tagNode] };
    g = addEdgeIfMissing(g, createEdge(projectId, tagNode.id, analysisNode.id, "evidences"));
  }
  return g;
}
function syncStyleGuideToGraph(graph, projectId, style) {
  let g = graph;
  const root = getProjectRootNode(g);
  if (!root) return g;
  for (const kw of style.keywords) {
    const ref = `sg-kw-${kw}`;
    const existing = g.nodes.find((n) => n.refId === ref);
    if (!existing) {
      const node = createNode(projectId, "StyleTag", kw, { scope: "project" }, ref);
      g = { ...g, nodes: [...g.nodes, node] };
      g = addEdgeIfMissing(g, createEdge(projectId, node.id, root.id, "belongs_to"));
    }
  }
  for (const mood of style.moodTags) {
    const ref = `sg-mood-${mood}`;
    if (!g.nodes.find((n) => n.refId === ref)) {
      const node = createNode(projectId, "Mood", mood, {}, ref);
      g = { ...g, nodes: [...g.nodes, node] };
      g = addEdgeIfMissing(g, createEdge(projectId, node.id, root.id, "belongs_to"));
    }
  }
  for (const font of style.fonts) {
    const ref = `sg-font-${font.name}`;
    g = removeNodesByRef(g, ref);
    const node = createNode(projectId, "Font", font.name, font, ref);
    g = { ...g, nodes: [...g.nodes, node] };
    g = addEdgeIfMissing(g, createEdge(projectId, node.id, root.id, "uses"));
  }
  for (const vfx of style.vfxRecommendations) {
    const ref = `sg-vfx-${vfx.name}`;
    g = removeNodesByRef(g, ref);
    const node = createNode(projectId, "VfxPreset", vfx.name, vfx, ref);
    g = { ...g, nodes: [...g.nodes, node] };
    g = addEdgeIfMissing(g, createEdge(projectId, node.id, root.id, "implements"));
  }
  for (const film of style.similarShorts) {
    const ref = `sg-film-${film.id}`;
    g = removeNodesByRef(g, ref);
    const node = createNode(
      projectId,
      "ReferenceFilm",
      film.title,
      film,
      ref
    );
    g = { ...g, nodes: [...g.nodes, node] };
    g = addEdgeIfMissing(g, createEdge(projectId, node.id, root.id, "similar_to", {
      similarity: film.similarity
    }));
  }
  const paletteRef = "sg-poster-palette";
  g = removeNodesByRef(g, paletteRef);
  const paletteNode = createNode(
    projectId,
    "ColorPalette",
    "\u6D77\u62A5\u8272\u677F",
    style.posterStyle,
    paletteRef
  );
  g = { ...g, nodes: [...g.nodes, paletteNode] };
  g = addEdgeIfMissing(g, createEdge(projectId, paletteNode.id, root.id, "belongs_to"));
  return g;
}
function computeGraphLayout(graph) {
  const layers = [
    ["Project"],
    ["Brief"],
    ["Asset"],
    ["Analysis", "DocumentSection"],
    ["Shot", "StyleTag", "Mood", "ColorPalette", "Font", "VfxPreset", "ReferenceFilm", "Implementation"]
  ];
  const layerIndex = /* @__PURE__ */ new Map();
  layers.forEach((types, i) => types.forEach((t) => layerIndex.set(t, i)));
  const byLayer = /* @__PURE__ */ new Map();
  for (const node of graph.nodes) {
    let li = layerIndex.get(node.type) ?? 4;
    if (node.props.fromStyleDataset === true) li = Math.min(li + 1, 4);
    if (!byLayer.has(li)) byLayer.set(li, []);
    byLayer.get(li).push(node);
  }
  const result = [];
  const layerGap = 120;
  const nodeGap = 140;
  for (const [li, nodes] of byLayer.entries()) {
    const totalWidth = (nodes.length - 1) * nodeGap;
    nodes.forEach((node, i) => {
      result.push({
        ...node,
        x: i * nodeGap - totalWidth / 2 + 400,
        y: li * layerGap + 60
      });
    });
  }
  return result;
}

// shared/src/knowgo/styleDataset.ts
var STYLE_DATASET = [
  {
    id: "dir-wkw",
    category: "director",
    name: "Wong Kar-wai",
    nameZh: "\u738B\u5BB6\u536B",
    tags: ["\u6000\u65E7", "\u6696\u8272", "\u6162\u8282\u594F", "\u624B\u6301", "step print"],
    description: "step printing \u62D6\u5F71\u3001\u6696\u9EC4/\u7EFF\u8272\u8C03\u3001\u6162\u5FEB\u95E8\u60C5\u7EEA",
    implementation: "\u964D\u5E27\u62CD\u6444 +  step print \u6216\u540E\u671F\u5E27\u6DF7\u5408\uFF1B\u6696\u8272 LUT + \u8F7B\u5FAE\u62D6\u5F71",
    tools: ["DaVinci Resolve", "After Effects"]
  },
  {
    id: "dir-villeneuve",
    category: "director",
    name: "Denis Villeneuve",
    nameZh: "\u4E39\u5C3C\u65AF\xB7\u7EF4\u4F26\u7EBD\u74E6",
    tags: ["\u6781\u7B80", "\u5927\u6784\u56FE", "\u4F4E\u9971\u548C", "\u5BF9\u79F0", "\u79D1\u5E7B"],
    description: "\u5927\u9762\u79EF\u7559\u767D\u3001\u5BF9\u79F0\u6784\u56FE\u3001\u4F4E\u9971\u548C\u51B7\u8C03",
    implementation: "\u5BBD\u94F6\u5E55\u88C1\u5207 + \u4F4E\u9971\u548C\u8C03\u8272 + \u5BF9\u79F0\u6784\u56FE\u53D6\u666F",
    tools: ["DaVinci Resolve", "Premiere Pro"]
  },
  {
    id: "film-blade-runner",
    category: "film",
    name: "Blade Runner 2049",
    nameZh: "\u94F6\u7FFC\u6740\u624B 2049",
    tags: ["\u8D5B\u535A\u670B\u514B", "\u9713\u8679", "\u51B7\u8272\u8C03", "\u5927\u8FDC\u666F", "Roger Deakins"],
    description: "\u6A59\u96FE\u4E0E\u51B7\u84DD\u5BF9\u6BD4\u3001\u5DE8\u5927\u8D1F\u7A7A\u95F4\u3001\u9713\u8679\u70B9\u7F00",
    implementation: "Teal/Orange \u5206\u79BB + \u4F53\u79EF\u5149 + \u5927\u5E7F\u89D2\u5EFA\u7ACB\u955C\u5934",
    tools: ["DaVinci Resolve", "Nuke"]
  },
  {
    id: "film-in-mood",
    category: "film",
    name: "In the Mood for Love",
    nameZh: "\u82B1\u6837\u5E74\u534E",
    tags: ["\u6000\u65E7", "\u65D7\u888D", "\u6696\u8272", "\u6162\u955C", "\u5B64\u72EC"],
    description: "\u7A84\u8D70\u5ECA\u6784\u56FE\u3001\u6696\u9EC4\u706F\u5149\u3001\u6162\u8282\u594F\u53D9\u4E8B",
    implementation: "\u957F\u7126\u538B\u7F29\u7A7A\u95F4 + \u6696\u8272\u94A8\u4E1D\u706F\u8FD8\u539F + \u6162\u63A8\u955C",
    tools: ["DaVinci Resolve", "Lightroom"]
  },
  {
    id: "film-a24",
    category: "film",
    name: "A24 aesthetic",
    nameZh: "A24 \u7F8E\u5B66",
    tags: ["\u72EC\u7ACB\u7535\u5F71", "\u81EA\u7136\u5149", "\u4F4E\u9884\u7B97\u611F", "\u60C5\u7EEA", "\u7559\u767D"],
    description: "\u81EA\u7136\u5149\u4E3A\u4E3B\u3001\u6D45\u666F\u6DF1\u3001\u60C5\u7EEA\u9A71\u52A8\u3001\u975E\u5E38\u89C4\u6784\u56FE",
    implementation: "\u53EF\u7528\u5149\u62CD\u6444 + \u8F7B\u5FAE\u964D\u9971\u548C + \u624B\u6301\u5FAE\u6643",
    tools: ["DaVinci Resolve", "Capture One"]
  },
  {
    id: "color-teal-orange",
    category: "color_grade",
    name: "Teal & Orange",
    nameZh: "\u9752\u6A59\u5BF9\u6BD4",
    tags: ["\u5546\u4E1A", "\u597D\u83B1\u575E", "\u5BF9\u6BD4", "\u6696\u8272", "\u51B7\u8272"],
    description: "\u80A4\u8272\u504F\u6A59\u3001\u9634\u5F71\u504F\u9752\u7684\u7ECF\u5178\u5546\u4E1A\u8C03\u8272",
    implementation: "Lift/Gamma/Gain \u5206\u79BB\u80A4\u8272\u4E0E\u80CC\u666F\uFF1B\u6216\u52A0\u8F7D TealOrange LUT",
    tools: ["DaVinci Resolve", "FilmConvert"]
  },
  {
    id: "color-bleach-bypass",
    category: "color_grade",
    name: "Bleach Bypass",
    nameZh: "\u8DF3\u6F02",
    tags: ["\u9AD8\u5BF9\u6BD4", "\u4F4E\u9971\u548C", "\u6218\u4E89", "\u786C\u6838", "\u80F6\u7247"],
    description: "\u4FDD\u7559\u94F6\u76D0\u611F\u3001\u4F4E\u9971\u548C\u9AD8\u5BF9\u6BD4\u3001\u9897\u7C92\u660E\u663E",
    implementation: "Resolve \u8272\u5F69\u7A7A\u95F4\u8DF3\u6F02\u9884\u8BBE + 35mm \u9897\u7C92\u53E0\u52A0",
    tools: ["DaVinci Resolve", "FilmConvert"]
  },
  {
    id: "color-film-cold",
    category: "color_grade",
    name: "Film Cold",
    nameZh: "\u80F6\u7247\u51B7\u8C03",
    tags: ["\u51B7\u8272\u8C03", "\u80F6\u7247", "\u4F4E\u9971\u548C", "\u7EAA\u5F55\u7247"],
    description: "\u504F\u84DD\u7EFF\u9634\u5F71\u3001\u67D4\u548C\u9AD8\u5149\u3001\u8F7B\u5FAE\u9897\u7C92",
    implementation: "\u964D\u4F4E\u8272\u6E29 + \u9634\u5F71\u52A0\u9752 + \u66F2\u7EBF\u67D4\u5316\u9AD8\u5149",
    tools: ["DaVinci Resolve", "Lightroom"]
  },
  {
    id: "shot-match-cut",
    category: "shot_language",
    name: "Match Cut",
    nameZh: "\u5339\u914D\u526A\u8F91",
    tags: ["\u8F6C\u573A", "\u53D9\u4E8B", "\u5F62\u72B6", "\u8282\u594F"],
    description: "\u5F62\u72B6/\u52A8\u4F5C/\u6784\u56FE\u5339\u914D\u7684\u4E24\u955C\u5934\u786C\u5207",
    implementation: "\u524D\u671F\u62CD\u6444\u65F6\u89C4\u5212\u5339\u914D\u5143\u7D20\uFF1B\u540E\u671F\u5207\u70B9\u5BF9\u9F50\u52A8\u4F5C\u5CF0\u503C",
    tools: ["Premiere Pro", "Final Cut Pro"]
  },
  {
    id: "shot-speed-ramp",
    category: "shot_language",
    name: "Speed Ramp",
    nameZh: "\u901F\u5EA6\u66F2\u7EBF",
    tags: ["\u5361\u70B9", "\u8282\u594F", "MV", "\u8FD0\u52A8"],
    description: "\u6162\u52A8\u4F5C\u4E0E\u5E38\u901F/\u5FEB\u5207\u4EA4\u66FF\u5F3A\u5316\u8282\u62CD",
    implementation: "120fps \u5347\u683C + \u65F6\u95F4\u91CD\u6620\u5C04\u66F2\u7EBF\u5BF9\u9F50\u97F3\u4E50\u8282\u62CD",
    tools: ["Premiere Pro", "DaVinci Resolve", "After Effects"]
  },
  {
    id: "shot-dolly-zoom",
    category: "shot_language",
    name: "Dolly Zoom",
    nameZh: "\u6ED1\u52A8\u53D8\u7126",
    tags: ["\u7729\u6655", "\u5FC3\u7406", "\u5E0C\u533A\u67EF\u514B", "\u5F20\u529B"],
    description: "\u63A8\u8F68\u4E0E\u53D8\u7126\u53CD\u5411\u8FD0\u52A8\u9020\u6210\u7A7A\u95F4\u626D\u66F2\u611F",
    implementation: "\u6ED1\u8F68\u63A8\u8FD1\u540C\u65F6 zoom out\uFF08\u6216\u53CD\u4E4B\uFF09\uFF0C\u4FDD\u6301\u4E3B\u4F53\u5927\u5C0F\u4E0D\u53D8",
    tools: ["\u6ED1\u8F68", "\u7535\u52A8\u53D8\u7126\u955C\u5934", "Premiere Pro"]
  },
  {
    id: "shot-halation",
    category: "shot_language",
    name: "Halation / Bloom",
    nameZh: "\u5149\u6655\u6EA2\u51FA",
    tags: ["\u80F6\u7247", "\u68A6\u5E7B", "\u9AD8\u5149", "\u590D\u53E4"],
    description: "\u9AD8\u5149\u8FB9\u7F18\u67D4\u548C\u6EA2\u51FA\uFF0C\u80F6\u7247/\u68A6\u5E7B\u611F",
    implementation: "\u9AD8\u5149\u6A21\u7CCA\u53E0\u52A0 + \u6696\u8272 glow\uFF1B\u6216 FilmConvert halation",
    tools: ["DaVinci Resolve", "After Effects", "FilmConvert"]
  },
  {
    id: "font-futura",
    category: "font",
    name: "Futura",
    nameZh: "Futura",
    tags: ["\u51E0\u4F55", "\u73B0\u4EE3", "Apple", "\u5E7F\u544A", "\u65E0\u886C\u7EBF"],
    description: "\u51E0\u4F55\u65E0\u886C\u7EBF\uFF0CApple \u5E7F\u544A\u5E38\u7528",
    implementation: "\u5927\u5B57\u53F7\u6807\u9898 + \u5BBD\u5B57\u8DDD + \u5927\u91CF\u7559\u767D",
    tools: ["Figma", "After Effects", "Premiere Pro"]
  },
  {
    id: "font-helvetica",
    category: "font",
    name: "Helvetica Neue",
    nameZh: "Helvetica Neue",
    tags: ["\u745E\u58EB", "\u4E2D\u6027", "\u7EAA\u5F55\u7247", "\u5B57\u5E55"],
    description: "\u4E2D\u6027\u7ECF\u5178\uFF0C\u9002\u5408\u5B57\u5E55\u4E0E\u6B63\u6587",
    implementation: "Medium \u5B57\u91CD\u5B57\u5E55 + \u5E95\u90E8\u5B89\u5168\u533A\u7559\u767D",
    tools: ["Figma", "Premiere Pro"]
  },
  {
    id: "vfx-neon-glow",
    category: "vfx",
    name: "Neon Glow",
    nameZh: "\u9713\u8679\u5149\u6655",
    tags: ["\u8D5B\u535A\u670B\u514B", "\u591C\u666F", "\u9713\u8679", "\u57CE\u5E02"],
    description: "\u9AD8\u9971\u548C\u8FB9\u7F18\u53D1\u5149\uFF0C\u9002\u5408\u8D5B\u535A\u670B\u514B\u591C\u666F",
    implementation: "Duplicate \u5C42 + \u9AD8\u65AF\u6A21\u7CCA + Add \u6DF7\u5408\u6A21\u5F0F",
    tools: ["After Effects", "DaVinci Resolve Fusion"]
  },
  {
    id: "vfx-film-grain",
    category: "vfx",
    name: "Film Grain",
    nameZh: "\u80F6\u7247\u9897\u7C92",
    tags: ["\u80F6\u7247", "\u590D\u53E4", "\u8D28\u611F", "35mm"],
    description: "\u53E0\u52A0 35mm \u9897\u7C92\u589E\u52A0\u6709\u673A\u8D28\u611F",
    implementation: "\u9897\u7C92 overlay 15\u201325%\uFF0C\u968F\u4EAE\u5EA6\u53D8\u5316",
    tools: ["FilmConvert", "DaVinci Resolve", "Dehancer"]
  },
  {
    id: "mood-neon-loneliness",
    category: "mood",
    name: "Neon Loneliness",
    nameZh: "\u9713\u8679\u5B64\u72EC",
    tags: ["\u8D5B\u535A\u670B\u514B", "\u5B64\u72EC", "\u96E8\u591C", "\u57CE\u5E02", "\u51B7\u5CFB"],
    description: "\u96E8\u591C\u57CE\u5E02\u4E2D\u7684\u5B64\u72EC\u4E0E\u9713\u8679\u53CD\u5C04",
    implementation: "\u51B7\u8C03\u4E3B\u8272 + \u5C40\u90E8\u9713\u8679\u70B9\u7F00 + \u6162\u8282\u594F\u526A\u8F91",
    tools: ["DaVinci Resolve", "Premiere Pro"]
  },
  {
    id: "mood-melancholy",
    category: "mood",
    name: "Melancholy",
    nameZh: "\u5FE7\u90C1",
    tags: ["\u6162\u8282\u594F", "\u4F4E\u9971\u548C", "\u6000\u65E7", "\u60C5\u7EEA"],
    description: "\u4F4E\u9971\u548C\u3001\u6162\u8282\u594F\u3001\u5185\u7701\u53D9\u4E8B",
    implementation: "\u964D\u9971\u548C + \u957F\u955C\u5934 + \u73AF\u5883\u97F3\u4E3B\u5BFC",
    tools: ["DaVinci Resolve"]
  },
  {
    id: "film-apple-ad",
    category: "film",
    name: "Apple Product Film",
    nameZh: "Apple \u4EA7\u54C1\u7247",
    tags: ["\u5546\u4E1A", "\u6781\u7B80", "\u4EA7\u54C1", "\u81EA\u7136\u5149", "\u624B\u6301"],
    description: "\u5E72\u51C0\u80CC\u666F\u3001\u4EA7\u54C1\u7279\u5199\u3001\u81EA\u7136\u5149\u3001\u6781\u7B80\u5B57\u5E55",
    implementation: "\u67D4\u5149\u4EA7\u54C1\u5E03\u5149 + \u6D45\u666F\u6DF1 + Futura/Helvetica \u5B57\u5E55",
    tools: ["DaVinci Resolve", "Cinema 4D"]
  },
  {
    id: "color-neon-pop",
    category: "color_grade",
    name: "Neon Pop",
    nameZh: "\u9713\u8679\u6CE2\u666E",
    tags: ["\u9AD8\u9971\u548C", "\u8D5B\u535A\u670B\u514B", "\u6CE2\u666E", "\u9713\u8679"],
    description: "\u9AD8\u9971\u548C\u6D0B\u7EA2/\u9752\u8272\u3001\u5F3A\u5BF9\u6BD4",
    implementation: "\u9971\u548C\u5EA6\u63D0\u5347 + \u5206\u79BB\u8272\u8C03\u9634\u5F71\u504F\u9752\u9AD8\u5149\u504F\u54C1\u7EA2",
    tools: ["DaVinci Resolve", "Lightroom"]
  }
];
function tokenize(text) {
  return text.toLowerCase().split(/[\s,，、·/|]+/).filter((t) => t.length > 1);
}
function matchStyleDataset(queries, limit = 6) {
  const queryTokens = new Set(
    queries.flatMap((q) => [...tokenize(q), ...q.toLowerCase().split("")].filter((t) => t.length > 1))
  );
  const scored = STYLE_DATASET.map((entry) => {
    let score = 0;
    const corpus = [
      entry.name,
      entry.nameZh,
      entry.description,
      entry.implementation,
      ...entry.tags
    ].join(" ").toLowerCase();
    for (const tag of entry.tags) {
      if (queries.some((q) => q.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(q.toLowerCase()))) {
        score += 3;
      }
    }
    for (const token of queryTokens) {
      if (corpus.includes(token)) score += 1;
    }
    for (const q of queries) {
      if (q.length > 2 && (corpus.includes(q.toLowerCase()) || entry.nameZh.includes(q))) {
        score += 2;
      }
    }
    return { entry, score: score / Math.max(entry.tags.length, 1) };
  }).filter((m) => m.score > 0).sort((a, b) => b.score - a.score);
  const maxScore = scored[0]?.score ?? 1;
  return scored.slice(0, limit).map((m) => ({
    ...m,
    score: Math.min(0.98, 0.55 + m.score / maxScore * 0.43)
  }));
}
function listStyleDataset(category) {
  if (!category) return STYLE_DATASET;
  return STYLE_DATASET.filter((e) => e.category === category);
}

// shared/src/knowgo/datasetSync.ts
var CATEGORY_NODE_TYPE = {
  director: "ReferenceFilm",
  film: "ReferenceFilm",
  color_grade: "ColorPalette",
  shot_language: "StyleTag",
  font: "Font",
  vfx: "VfxPreset",
  mood: "Mood"
};
function datasetNodeLabel(entry) {
  return entry.nameZh || entry.name;
}
function linkStyleDatasetToGraph(graph, projectId, keywords) {
  let g = graph;
  const root = getProjectRootNode(g);
  if (!root) return g;
  const matches = matchStyleDataset(keywords, 8);
  if (matches.length === 0) return g;
  for (const { entry, score } of matches) {
    const refId = `dataset-${entry.id}`;
    const nodeType = CATEGORY_NODE_TYPE[entry.category];
    const node = createNode(
      projectId,
      nodeType,
      datasetNodeLabel(entry),
      {
        fromStyleDataset: true,
        datasetId: entry.id,
        category: entry.category,
        name: entry.name,
        nameZh: entry.nameZh,
        tags: entry.tags,
        description: entry.description,
        implementation: entry.implementation,
        tools: entry.tools,
        matchScore: score
      },
      refId
    );
    const { graph: g2, node: datasetN } = upsertNode(g, node);
    g = g2;
    g = addEdgeIfMissing(
      g,
      createEdge(projectId, root.id, datasetN.id, "similar_to", {
        score,
        source: "style-dataset"
      })
    );
    for (const tagNode of g.nodes.filter(
      (n) => n.type === "StyleTag" || n.type === "Mood"
    )) {
      const tagLabel = tagNode.label.toLowerCase();
      if (entry.tags.some((t) => tagLabel.includes(t.toLowerCase()) || t.toLowerCase().includes(tagLabel))) {
        g = addEdgeIfMissing(
          g,
          createEdge(projectId, tagNode.id, datasetN.id, "references", {
            source: "style-dataset"
          })
        );
      }
    }
  }
  return g;
}
function collectKeywordsFromGraph(graph) {
  const kw = /* @__PURE__ */ new Set();
  for (const node of graph.nodes) {
    kw.add(node.label);
    if (node.type === "StyleTag" || node.type === "Mood") {
      const tags = node.props.tags;
      if (Array.isArray(tags)) tags.forEach((t) => kw.add(String(t)));
    }
    if (node.type === "Analysis") {
      const artStyle = node.props.artStyle;
      const filmStyle = node.props.filmStyle;
      if (artStyle) kw.add(String(artStyle));
      if (filmStyle) kw.add(String(filmStyle));
      const keywords = node.props.overallKeywords;
      if (Array.isArray(keywords)) keywords.forEach((k) => kw.add(String(k)));
    }
  }
  return [...kw].filter(Boolean);
}

// shared/src/knowgo/documentFromGraph.ts
function nodeList(graph, type) {
  return graph.nodes.filter((n) => n.type === type);
}
function buildDocumentFromGraph(graph, project) {
  const briefNodes = nodeList(graph, "Brief");
  const brief = briefNodes[0]?.props;
  const assets = nodeList(graph, "Asset");
  const analyses = nodeList(graph, "Analysis");
  const shots = nodeList(graph, "Shot");
  const styleTags = nodeList(graph, "StyleTag");
  const moods = nodeList(graph, "Mood");
  const palettes = nodeList(graph, "ColorPalette");
  const fonts = nodeList(graph, "Font");
  const vfx = nodeList(graph, "VfxPreset");
  const films = nodeList(graph, "ReferenceFilm");
  const impls = nodeList(graph, "Implementation");
  const datasetNodes = graph.nodes.filter((n) => n.props.fromStyleDataset === true);
  const overviewLines = [];
  if (brief) {
    if (brief.client) overviewLines.push(`**\u5BA2\u6237**\uFF1A${brief.client}`);
    if (brief.objective) overviewLines.push(`**\u76EE\u6807**\uFF1A${brief.objective}`);
    if (brief.audience) overviewLines.push(`**\u53D7\u4F17**\uFF1A${brief.audience}`);
    if (brief.tone) overviewLines.push(`**\u8C03\u6027**\uFF1A${brief.tone}`);
    if (brief.deliverables) overviewLines.push(`**\u4EA4\u4ED8\u7269**\uFF1A${brief.deliverables}`);
  }
  if (overviewLines.length === 0 && project.brief.title) {
    overviewLines.push(`**\u9879\u76EE**\uFF1A${project.brief.title}`);
  }
  const inspirationLines = assets.map((a) => {
    const platform = a.props.platform ?? a.props.type ?? "";
    return `- **${a.label}**\uFF08${platform}\uFF09`;
  });
  const visualLines = [];
  for (const a of analyses) {
    const mediaType = a.props.mediaType === "video" ? "\u89C6\u9891" : "\u56FE\u7247";
    visualLines.push(`### ${mediaType}\u5206\u6790 \xB7 ${a.label}`);
    if (a.props.artStyle) visualLines.push(`- \u827A\u672F\u98CE\u683C\uFF1A${a.props.artStyle}`);
    if (a.props.filmStyle) visualLines.push(`- \u77ED\u7247\u98CE\u683C\uFF1A${a.props.filmStyle}`);
    if (a.props.colorGrading) visualLines.push(`- \u8C03\u8272\uFF1A${a.props.colorGrading}`);
    if (a.props.mood) visualLines.push(`- \u60C5\u7EEA\uFF1A${a.props.mood}`);
    visualLines.push("");
  }
  if (styleTags.length) {
    visualLines.push(`**\u98CE\u683C\u6807\u7B7E**\uFF1A${styleTags.map((t) => t.label).join(" \xB7 ")}`);
  }
  if (moods.length) {
    visualLines.push(`**\u60C5\u7EEA**\uFF1A${moods.map((m) => m.label).join(" \xB7 ")}`);
  }
  if (palettes.length) {
    visualLines.push(`**\u8272\u677F**\uFF1A${palettes.map((p) => p.label).join(" \xB7 ")}`);
  }
  if (fonts.length) {
    visualLines.push(`**\u5B57\u4F53**\uFF1A${fonts.map((f) => f.label).join(" \xB7 ")}`);
  }
  if (films.length) {
    visualLines.push(`**\u53C2\u8003\u7247**\uFF1A${films.map((f) => f.label).join(" \xB7 ")}`);
  }
  const implLines = [];
  for (const impl of impls) {
    implLines.push(`### ${impl.label}`);
    if (impl.props.summary) implLines.push(String(impl.props.summary));
    const tools = impl.props.tools;
    if (Array.isArray(tools) && tools.length) {
      implLines.push(`\u5DE5\u5177\uFF1A${tools.join(", ")}`);
    }
    const steps = impl.props.steps;
    if (Array.isArray(steps)) {
      steps.forEach((s, i) => implLines.push(`${i + 1}. ${s}`));
    }
    implLines.push("");
  }
  for (const v of vfx) {
    implLines.push(`### \u7279\u6548 \xB7 ${v.label}`);
    if (v.props.description) implLines.push(String(v.props.description));
    if (v.props.implementation) implLines.push(String(v.props.implementation));
    implLines.push("");
  }
  if (shots.length) {
    implLines.push("### \u5206\u955C\u8981\u70B9");
    for (const s of shots.slice(0, 12)) {
      implLines.push(
        `- **#${s.props.index ?? "?"}** ${s.props.shotType ?? ""} \xB7 ${s.props.description ?? s.label}\uFF08${s.props.implementation ?? ""}\uFF09`
      );
    }
  }
  if (datasetNodes.length) {
    implLines.push("### Style Dataset \u5339\u914D");
    for (const d of datasetNodes) {
      const score = d.props.matchScore;
      implLines.push(
        `- **${d.label}**${score ? ` (${Math.round(Number(score) * 100)}%)` : ""}\uFF1A${d.props.description ?? ""}`
      );
      if (d.props.implementation) implLines.push(`  \u5B9E\u73B0\uFF1A${d.props.implementation}`);
    }
  }
  const assetRefIds = assets.map((a) => a.refId).filter((id) => !!id);
  return {
    title: project.brief.title || project.title || "\u7075\u611F\u5206\u6790\u6587\u6863",
    sections: [
      {
        id: "overview",
        heading: "\u9879\u76EE\u6982\u8FF0",
        content: overviewLines.join("\n\n"),
        mediaIds: []
      },
      {
        id: "inspiration",
        heading: "\u7075\u611F\u6765\u6E90",
        content: inspirationLines.join("\n") || "_\u6682\u65E0\u91C7\u96C6\u7D20\u6750_",
        mediaIds: assetRefIds.slice(0, 6)
      },
      {
        id: "visual",
        heading: "\u89C6\u89C9\u8BED\u8A00",
        content: visualLines.join("\n") || "_\u8BF7\u5148\u5B8C\u6210\u7075\u611F\u5206\u6790_",
        mediaIds: []
      },
      {
        id: "implementation",
        heading: "\u5B9E\u73B0\u65B9\u6848",
        content: implLines.join("\n") || "_\u56FE\u8C31\u4E2D\u6682\u65E0\u5B9E\u73B0\u8282\u70B9_",
        mediaIds: []
      }
    ],
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// shared/src/prerector/constants.ts
var SCOPE_LABELS = {
  video: { label: "\u89C6\u9891\u65F6\u957F", unit: "min", default: 5 },
  audio: { label: "\u66F2\u76EE/\u65F6\u957F", unit: "min", default: 4 },
  design: { label: "\u9875\u9762/\u5C4F\u5E55\u6570", unit: "\u9875", default: 5 },
  software: { label: "\u529F\u80FD\u6A21\u5757\u6570", unit: "\u4E2A", default: 8 },
  campaign: { label: "\u6D3B\u52A8\u5468\u671F", unit: "\u5929", default: 14 },
  homework: { label: "\u4F5C\u4E1A\u5468\u671F", unit: "\u5929", default: 10 },
  general: { label: "\u9884\u4F30\u5DE5\u671F", unit: "\u5929", default: 7 }
};
var DIFFICULTY_LABELS = {
  1: "\u7B80\u5355",
  2: "\u8F83\u6613",
  3: "\u4E2D\u7B49",
  4: "\u8F83\u96BE",
  5: "\u56F0\u96BE"
};

// desound/web/backend/src/library/store.ts
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
function dataRoot() {
  if (process.env.LIBRARY_DATA_DIR) return process.env.LIBRARY_DATA_DIR;
  if (process.env.VERCEL) return "/tmp/everec-library";
  return path.join(process.cwd(), "data", "library");
}
function manifestPath(root) {
  return path.join(root, "library.json");
}
function soundsDir(root) {
  return path.join(root, "sounds");
}
function ensureLibrary() {
  const root = dataRoot();
  fs.mkdirSync(soundsDir(root), { recursive: true });
  const mp = manifestPath(root);
  if (!fs.existsSync(mp)) {
    const manifest = { version: 1, sounds: [] };
    fs.writeFileSync(mp, JSON.stringify(manifest, null, 2));
  }
  return root;
}
function readManifest(root) {
  ensureLibrary();
  return JSON.parse(fs.readFileSync(manifestPath(root), "utf8"));
}
function writeManifest(root, manifest) {
  fs.writeFileSync(manifestPath(root), JSON.stringify(manifest, null, 2));
}
function chronoNow() {
  return Math.floor(Date.now() / 1e3).toString();
}
function listSounds() {
  const root = ensureLibrary();
  return readManifest(root).sounds.map((s) => ({
    ...s,
    audioUrl: `/api/library/sounds/${s.id}/audio`
  }));
}
function getSound(id) {
  return readManifest(ensureLibrary()).sounds.find((s) => s.id === id);
}
function getSoundFilePath(id) {
  const root = ensureLibrary();
  const asset = getSound(id);
  if (!asset) return null;
  const fp = path.join(soundsDir(root), asset.fileName);
  return fs.existsSync(fp) ? fp : null;
}
function importFile(sourcePath, name, tags = [], category = "music", source = "import") {
  const root = ensureLibrary();
  if (!fs.existsSync(sourcePath)) throw new Error(`file not found: ${sourcePath}`);
  const ext = path.extname(sourcePath).slice(1).toLowerCase() || "mp3";
  const id = v4_default();
  const fileName = `${id}.${ext}`;
  const dest = path.join(soundsDir(root), fileName);
  fs.copyFileSync(sourcePath, dest);
  const asset = {
    id,
    name: name ?? path.basename(sourcePath, path.extname(sourcePath)),
    fileName,
    format: ext,
    durationMs: 0,
    tags,
    category,
    createdAt: chronoNow(),
    source,
    audioUrl: `/api/library/sounds/${id}/audio`
  };
  const manifest = readManifest(root);
  manifest.sounds.push(asset);
  writeManifest(root, manifest);
  return asset;
}
function importBuffer(buffer, ext, name, tags = [], category = "music", source = "upload") {
  const root = ensureLibrary();
  const id = v4_default();
  const fileName = `${id}.${ext}`;
  const dest = path.join(soundsDir(root), fileName);
  fs.writeFileSync(dest, buffer);
  const asset = {
    id,
    name,
    fileName,
    format: ext,
    durationMs: 0,
    tags,
    category,
    createdAt: chronoNow(),
    source,
    audioUrl: `/api/library/sounds/${id}/audio`
  };
  const manifest = readManifest(root);
  manifest.sounds.push(asset);
  writeManifest(root, manifest);
  return asset;
}
function deleteSound(id) {
  const root = ensureLibrary();
  const manifest = readManifest(root);
  const idx = manifest.sounds.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("sound not found");
  const asset = manifest.sounds.splice(idx, 1)[0];
  const fp = path.join(soundsDir(root), asset.fileName);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  writeManifest(root, manifest);
}
async function downloadHttp(url, dest, referer) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  };
  if (referer) headers.Referer = referer;
  const res = await fetch(url, { headers, redirect: "follow" });
  if (!res.ok) throw new Error(`\u4E0B\u8F7D\u5931\u8D25: HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) throw new Error("\u4E0B\u8F7D\u5931\u8D25: \u6587\u4EF6\u4E3A\u7A7A");
  fs.writeFileSync(dest, buffer);
}
function downloadWithYtDlp(url, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const template = path.join(destDir, "download.%(ext)s");
  const result = spawnSync(
    "yt-dlp",
    ["-x", "--audio-format", "mp3", "--audio-quality", "0", "-o", template, "--no-playlist", url],
    { encoding: "utf8" }
  );
  if (result.status !== 0) throw new Error(result.stderr || "yt-dlp \u4E0B\u8F7D\u5931\u8D25");
  const exts = [".mp3", ".m4a", ".aac", ".wav", ".flac", ".ogg"];
  const files = fs.readdirSync(destDir).map((f) => path.join(destDir, f)).filter((f) => fs.statSync(f).isFile() && exts.includes(path.extname(f).toLowerCase())).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!files.length) throw new Error("\u4E0B\u8F7D\u5B8C\u6210\u4F46\u672A\u627E\u5230\u97F3\u9891\u6587\u4EF6");
  return files[0];
}
function tempDir() {
  const dir = path.join(ensureLibrary(), "temp");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function cleanupTemp() {
  const dir = path.join(ensureLibrary(), "temp");
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

// desound/web/backend/src/app.ts
var app = new Hono2().basePath("/api");
app.use("*", cors());
app.onError((err, c) => {
  console.error("[api error]", err);
  return c.json({ error: err.message || "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF" }, 500);
});
app.get(
  "/health",
  (c) => c.json({
    ok: true,
    platform: "web",
    vercel: !!process.env.VERCEL,
    dataDir: process.env.VERCEL ? "/tmp/everec-library" : "data/library"
  })
);
app.get("/library/sounds", (c) => {
  try {
    return c.json(listSounds());
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
app.get("/library/sounds/:id", (c) => {
  const sound = getSound(c.req.param("id"));
  if (!sound) return c.json({ error: "not found" }, 404);
  return c.json(sound);
});
app.get("/library/sounds/:id/audio", (c) => {
  try {
    const fp = getSoundFilePath(c.req.param("id"));
    if (!fp) return c.json({ error: "not found" }, 404);
    const ext = path2.extname(fp).slice(1).toLowerCase();
    const mime = ext === "mp3" ? "audio/mpeg" : ext === "wav" ? "audio/wav" : ext === "flac" ? "audio/flac" : ext === "m4a" ? "audio/mp4" : "application/octet-stream";
    const data = fs2.readFileSync(fp);
    c.header("Content-Type", mime);
    c.header("Accept-Ranges", "bytes");
    c.header("Cache-Control", "public, max-age=3600");
    return c.body(data);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
app.post("/library/upload", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;
    if (!file || typeof file === "string") {
      return c.json({ error: "\u8BF7\u4E0A\u4F20\u97F3\u9891\u6587\u4EF6" }, 400);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const original = file.name ?? "upload.mp3";
    const ext = path2.extname(original).slice(1).toLowerCase() || "mp3";
    const asset = importBuffer(
      buffer,
      ext,
      path2.basename(original, path2.extname(original)),
      ["bgm", "upload"],
      "music"
    );
    return c.json(asset);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
app.post("/library/upload-foley", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;
    if (!file || typeof file === "string") {
      return c.json({ error: "\u8BF7\u4E0A\u4F20\u97F3\u9891\u6587\u4EF6" }, 400);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const original = file.name ?? "foley.mp3";
    const ext = path2.extname(original).slice(1).toLowerCase() || "mp3";
    const asset = importBuffer(
      buffer,
      ext,
      path2.basename(original, path2.extname(original)),
      ["foley", "import"],
      "foley",
      "import:foley"
    );
    return c.json(asset);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
app.post("/library/save-foley-meta", async (c) => {
  const { name, presetId, tags } = await c.req.json();
  try {
    const meta = JSON.stringify({ presetId, params: {}, tags: tags ?? [] });
    const buffer = Buffer.from(meta, "utf-8");
    const asset = importBuffer(buffer, "foley.json", name, ["foley", presetId], "foley", `foley:${presetId}`);
    return c.json(asset);
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
app.post("/library/import-search", async (c) => {
  const { resultId, title, artist, previewUrl, source, playBvid } = await c.req.json();
  const displayName = `${title} - ${artist}`;
  const tags = ["bgm", "search", source];
  const sourceLabel = `search:${source}`;
  const tmp = tempDir();
  try {
    if (previewUrl) {
      const ext = previewUrl.includes(".m4a") || previewUrl.includes("m4s") ? "m4a" : "mp3";
      const dest2 = path2.join(tmp, `search.${ext}`);
      await downloadHttp(previewUrl, dest2);
      return c.json(importFile(dest2, displayName, tags, "music", sourceLabel));
    }
    const resolved = await resolveMusicAudioUrl({
      id: resultId,
      title,
      artist,
      album: "",
      durationMs: 0,
      source,
      previewUrl,
      playBvid
    });
    const dest = path2.join(tmp, `search.${resolved.ext}`);
    await downloadHttp(resolved.url, dest, resolved.referer);
    return c.json(importFile(dest, displayName, tags, "music", sourceLabel));
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  } finally {
    cleanupTemp();
  }
});
app.get("/search/play", async (c) => {
  const resultId = c.req.query("resultId") ?? "";
  const title = c.req.query("title") ?? "";
  const artist = c.req.query("artist") ?? "";
  const source = c.req.query("source") ?? "";
  const previewUrl = c.req.query("previewUrl") ?? "";
  try {
    const resolved = await resolveMusicAudioUrl({
      id: resultId,
      title,
      artist,
      album: "",
      durationMs: 0,
      source,
      previewUrl: previewUrl || void 0
    });
    const headers = { "User-Agent": "Mozilla/5.0" };
    if (resolved.referer) headers.Referer = resolved.referer;
    const upstream = await fetch(resolved.url, { headers, redirect: "follow" });
    if (!upstream.ok) return c.json({ error: `\u64AD\u653E\u5931\u8D25: HTTP ${upstream.status}` }, 502);
    const contentType = upstream.headers.get("content-type") ?? "";
    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (contentType.includes("text/html") || buffer.length < 2048) {
      return c.json({ error: "\u64AD\u653E\u5931\u8D25: \u65E0\u6CD5\u83B7\u53D6\u6709\u6548\u97F3\u9891" }, 502);
    }
    c.header("Content-Type", resolved.ext === "mp3" ? "audio/mpeg" : "audio/mp4");
    c.header("Accept-Ranges", "bytes");
    c.header("Cache-Control", "public, max-age=300");
    return c.body(buffer);
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});
app.post("/library/import-link", async (c) => {
  const link = await c.req.json();
  const tags = ["bgm", link.platform];
  const sourceLabel = `link:${link.platform}`;
  const tmp = tempDir();
  try {
    if (link.platform === "bilibili" && link.audioUrl) {
      const ext = link.audioUrl.includes(".m4a") ? "m4a" : "mp3";
      const dest = path2.join(tmp, `bilibili.${ext}`);
      await downloadHttp(link.audioUrl, dest, "https://www.bilibili.com");
      return c.json(importFile(dest, link.title, tags, "music", sourceLabel));
    }
    if ((link.platform === "xiaohongshu" || link.platform === "douyin") && link.audioUrl?.startsWith("http")) {
      const ext = link.audioUrl.includes(".mp4") ? "mp4" : "mp3";
      const dest = path2.join(tmp, `${link.platform}.${ext}`);
      await downloadHttp(link.audioUrl, dest);
      return c.json(importFile(dest, link.title, tags, "music", sourceLabel));
    }
    if (process.env.VERCEL) {
      return c.json(
        { error: "\u672A\u80FD\u83B7\u53D6\u53EF\u4E0B\u8F7D\u7684\u5A92\u4F53\u5730\u5740\uFF0C\u8BF7\u786E\u8BA4\u94FE\u63A5\u6709\u6548\u6216\u6362\u7528 Bilibili / iTunes \u641C\u7D22" },
        400
      );
    }
    const downloaded = downloadWithYtDlp(link.originalUrl, tmp);
    return c.json(
      importFile(
        downloaded,
        link.title !== "\u5F85\u4E0B\u8F7D" ? link.title : void 0,
        tags,
        "music",
        sourceLabel
      )
    );
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  } finally {
    cleanupTemp();
  }
});
app.delete("/library/sounds/:id", (c) => {
  try {
    deleteSound(c.req.param("id"));
    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: String(err) }, 404);
  }
});
app.get("/search/music", async (c) => {
  const q = c.req.query("q") ?? "";
  const limit = Number(c.req.query("limit") ?? "20");
  try {
    return c.json(await searchMusicOnline(q, limit));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});
app.get("/search/sfx", async (c) => {
  const q = c.req.query("q") ?? "";
  const limit = Number(c.req.query("limit") ?? "12");
  try {
    return c.json(await searchSfxOnline(q, limit));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});
app.post("/library/import-sfx", async (c) => {
  const { title, previewUrl, source } = await c.req.json();
  const tmp = tempDir();
  try {
    const ext = previewUrl.includes(".wav") ? "wav" : "mp3";
    const dest = path2.join(tmp, `sfx.${ext}`);
    await downloadHttp(previewUrl, dest);
    return c.json(
      importFile(dest, title, ["foley", "sfx", source], "foley", `sfx:${source}`)
    );
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  } finally {
    cleanupTemp();
  }
});
app.post("/library/parse-link", async (c) => {
  const { url } = await c.req.json();
  try {
    return c.json(await parseMediaUrl(url));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});
var app_default = app;

// knowgo/web/backend/src/app.ts
import fs6 from "node:fs";
import path6 from "node:path";

// knowgo/web/backend/src/analyze.ts
async function callOpenAiVision(apiKey, imageBase64, mimeType, prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` }
            }
          ]
        }
      ],
      max_tokens: 1500
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI Vision \u5931\u8D25: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}
var IMAGE_PROMPT = `\u4F60\u662F\u89C6\u89C9\u98CE\u683C\u5206\u6790\u4E13\u5BB6\u3002\u5206\u6790\u8FD9\u5F20\u56FE\u7247\uFF0C\u8FD4\u56DE JSON\uFF1A
{
  "subject": "\u4E3B\u4F53\u63CF\u8FF0",
  "composition": "\u6784\u56FE\u5206\u6790",
  "colorPalette": ["#hex", ...],
  "artStyle": "\u827A\u672F\u98CE\u683C\u540D\u79F0",
  "mood": "\u60C5\u7EEA",
  "techniques": ["\u6280\u6CD51", "\u6280\u6CD52"],
  "implementation": {
    "summary": "\u5B9E\u73B0\u6982\u8FF0",
    "tools": ["\u5DE5\u5177"],
    "steps": ["\u6B65\u9AA4"],
    "difficulty": "easy|medium|hard"
  }
}`;
async function analyzeImage(captureId, imageBuffer, mimeType, hint, apiKey) {
  if (apiKey) {
    try {
      const parsed = await callOpenAiVision(
        apiKey,
        imageBuffer.toString("base64"),
        mimeType,
        IMAGE_PROMPT
      );
      return {
        captureId,
        subject: String(parsed.subject ?? ""),
        composition: String(parsed.composition ?? ""),
        colorPalette: Array.isArray(parsed.colorPalette) ? parsed.colorPalette.map(String) : [],
        artStyle: String(parsed.artStyle ?? ""),
        mood: String(parsed.mood ?? ""),
        techniques: Array.isArray(parsed.techniques) ? parsed.techniques.map(String) : [],
        implementation: {
          summary: String(parsed.implementation?.summary ?? ""),
          tools: Array.isArray(parsed.implementation?.tools) ? parsed.implementation.tools.map(String) : [],
          steps: Array.isArray(parsed.implementation?.steps) ? parsed.implementation.steps.map(String) : [],
          difficulty: ["easy", "medium", "hard"].includes(
            String(parsed.implementation?.difficulty)
          ) ? String(parsed.implementation?.difficulty) : "medium"
        },
        source: "llm"
      };
    } catch (err) {
      console.warn("[knowgo] Vision fallback:", err);
    }
  }
  return analyzeImageLocal(captureId, hint);
}
async function analyzeVideo(captureId, durationSec, hint, apiKey) {
  if (apiKey && hint.length > 10) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: `\u57FA\u4E8E\u4EE5\u4E0B\u89C6\u9891\u63CF\u8FF0\uFF0C\u751F\u6210\u77ED\u7247\u98CE\u683C\u5206\u6790\u4E0E\u5206\u955C\u8868 JSON\u3002\u65F6\u957F ${durationSec} \u79D2\u3002
\u63CF\u8FF0\uFF1A${hint}
\u8FD4\u56DE\u683C\u5F0F\uFF1A
{
  "filmStyle": "",
  "pacing": "",
  "narrativeStructure": "",
  "colorGrading": "",
  "cameraLanguage": "",
  "overallKeywords": [],
  "shots": [{"index":1,"startSec":0,"endSec":5,"durationSec":5,"shotType":"","description":"","cameraMovement":"","implementation":"","thumbnailHint":""}]
}`
            }
          ],
          max_tokens: 2e3
        })
      });
      if (res.ok) {
        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        const local = analyzeVideoLocal(captureId, durationSec, hint);
        return {
          ...local,
          filmStyle: String(parsed.filmStyle ?? local.filmStyle),
          pacing: String(parsed.pacing ?? local.pacing),
          narrativeStructure: String(parsed.narrativeStructure ?? local.narrativeStructure),
          colorGrading: String(parsed.colorGrading ?? local.colorGrading),
          cameraLanguage: String(parsed.cameraLanguage ?? local.cameraLanguage),
          overallKeywords: Array.isArray(parsed.overallKeywords) ? parsed.overallKeywords.map(String) : local.overallKeywords,
          shots: Array.isArray(parsed.shots) ? parsed.shots : local.shots,
          source: "llm"
        };
      }
    } catch (err) {
      console.warn("[knowgo] Video LLM fallback:", err);
    }
  }
  return analyzeVideoLocal(captureId, durationSec, hint);
}
function buildStyleGuide(hint, keywords) {
  return buildStyleGuideLocal(hint, keywords);
}

// knowgo/web/backend/src/graphStore.ts
import fs4 from "node:fs";
import path4 from "node:path";

// knowgo/web/backend/src/graphDb.ts
import { createRequire } from "node:module";
import fs3 from "node:fs";
import path3 from "node:path";
var require2 = createRequire(import.meta.url);
var DATA_DIR = process.env.VERCEL ? path3.join("/tmp", "everec-knowgo") : path3.join(process.cwd(), "data", "knowgo");
var DB_PATH = path3.join(DATA_DIR, "project-graph.db");
var GRAPHS_DIR = path3.join(DATA_DIR, "graphs");
var db = null;
function useSqlite() {
  return process.env.KNOWGO_GRAPH_STORE !== "json" && !process.env.VERCEL;
}
function getDb() {
  if (!useSqlite()) {
    throw new Error("SQLite graph store is disabled");
  }
  if (db) return db;
  fs3.mkdirSync(DATA_DIR, { recursive: true });
  const Database = require2("better-sqlite3");
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS graph_nodes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      props TEXT NOT NULL DEFAULT '{}',
      ref_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_gn_project ON graph_nodes(project_id);
    CREATE INDEX IF NOT EXISTS idx_gn_type ON graph_nodes(project_id, type);
    CREATE INDEX IF NOT EXISTS idx_gn_ref ON graph_nodes(project_id, ref_id);

    CREATE TABLE IF NOT EXISTS graph_edges (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      from_id TEXT NOT NULL,
      to_id TEXT NOT NULL,
      type TEXT NOT NULL,
      props TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ge_project ON graph_edges(project_id);

    CREATE TABLE IF NOT EXISTS graph_meta (
      project_id TEXT PRIMARY KEY,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}
function rowToNode(row) {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    type: row.type,
    label: String(row.label),
    props: JSON.parse(String(row.props || "{}")),
    refId: row.ref_id ? String(row.ref_id) : void 0,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    version: Number(row.version)
  };
}
function rowToEdge(row) {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    from: String(row.from_id),
    to: String(row.to_id),
    type: row.type,
    props: row.props ? JSON.parse(String(row.props)) : void 0,
    createdAt: String(row.created_at)
  };
}
function sqliteLoadGraph(projectId) {
  if (!useSqlite()) return null;
  const database = getDb();
  const meta = database.prepare("SELECT updated_at FROM graph_meta WHERE project_id = ?").get(projectId);
  if (!meta) return null;
  const nodes = database.prepare("SELECT * FROM graph_nodes WHERE project_id = ?").all(projectId).map((r) => rowToNode(r));
  const edges = database.prepare("SELECT * FROM graph_edges WHERE project_id = ?").all(projectId).map((r) => rowToEdge(r));
  return { projectId, nodes, edges, updatedAt: meta.updated_at };
}
function sqliteSaveGraph(graph) {
  if (!useSqlite()) return;
  const database = getDb();
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const tx = database.transaction(() => {
    database.prepare("DELETE FROM graph_nodes WHERE project_id = ?").run(graph.projectId);
    database.prepare("DELETE FROM graph_edges WHERE project_id = ?").run(graph.projectId);
    const insertNode = database.prepare(`
      INSERT INTO graph_nodes (id, project_id, type, label, props, ref_id, created_at, updated_at, version)
      VALUES (@id, @projectId, @type, @label, @props, @refId, @createdAt, @updatedAt, @version)
    `);
    for (const n of graph.nodes) {
      insertNode.run({
        id: n.id,
        projectId: n.projectId,
        type: n.type,
        label: n.label,
        props: JSON.stringify(n.props),
        refId: n.refId ?? null,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        version: n.version
      });
    }
    const insertEdge = database.prepare(`
      INSERT INTO graph_edges (id, project_id, from_id, to_id, type, props, created_at)
      VALUES (@id, @projectId, @from, @to, @type, @props, @createdAt)
    `);
    for (const e of graph.edges) {
      insertEdge.run({
        id: e.id,
        projectId: e.projectId,
        from: e.from,
        to: e.to,
        type: e.type,
        props: e.props ? JSON.stringify(e.props) : null,
        createdAt: e.createdAt
      });
    }
    database.prepare(
      "INSERT INTO graph_meta (project_id, updated_at) VALUES (?, ?) ON CONFLICT(project_id) DO UPDATE SET updated_at = excluded.updated_at"
    ).run(graph.projectId, updatedAt);
  });
  tx();
}
function sqliteDeleteGraph(projectId) {
  if (!useSqlite()) return;
  const database = getDb();
  database.prepare("DELETE FROM graph_nodes WHERE project_id = ?").run(projectId);
  database.prepare("DELETE FROM graph_edges WHERE project_id = ?").run(projectId);
  database.prepare("DELETE FROM graph_meta WHERE project_id = ?").run(projectId);
}
function migrateJsonGraphToSqlite(projectId) {
  if (!useSqlite()) return null;
  fs3.mkdirSync(GRAPHS_DIR, { recursive: true });
  const fp = path3.join(GRAPHS_DIR, `${projectId}.json`);
  if (!fs3.existsSync(fp)) return null;
  const graph = JSON.parse(fs3.readFileSync(fp, "utf-8"));
  sqliteSaveGraph(graph);
  fs3.renameSync(fp, `${fp}.migrated`);
  return graph;
}
function graphStoreBackend() {
  return useSqlite() ? "sqlite" : "json";
}

// knowgo/web/backend/src/graphStore.ts
var DATA_DIR2 = process.env.VERCEL ? path4.join("/tmp", "everec-knowgo") : path4.join(process.cwd(), "data", "knowgo");
var GRAPHS_DIR2 = path4.join(DATA_DIR2, "graphs");
function ensureGraphsDir() {
  fs4.mkdirSync(GRAPHS_DIR2, { recursive: true });
}
function jsonGraphPath(projectId) {
  return path4.join(GRAPHS_DIR2, `${projectId}.json`);
}
function loadGraphJson(projectId) {
  ensureGraphsDir();
  const fp = jsonGraphPath(projectId);
  if (!fs4.existsSync(fp)) return null;
  return JSON.parse(fs4.readFileSync(fp, "utf-8"));
}
function saveGraphJson(graph) {
  ensureGraphsDir();
  const updated = { ...graph, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  fs4.writeFileSync(jsonGraphPath(graph.projectId), JSON.stringify(updated, null, 2), "utf-8");
}
function persistGraph(graph) {
  if (graphStoreBackend() === "sqlite") {
    sqliteSaveGraph(graph);
  } else {
    saveGraphJson(graph);
  }
}
function withDatasetLink(graph, projectId, extra = []) {
  const keywords = [...collectKeywordsFromGraph(graph), ...extra];
  return linkStyleDatasetToGraph(graph, projectId, keywords);
}
function loadGraph(projectId) {
  if (graphStoreBackend() === "sqlite") {
    let graph2 = sqliteLoadGraph(projectId);
    if (!graph2) {
      graph2 = migrateJsonGraphToSqlite(projectId);
    }
    if (graph2) return graph2;
  } else {
    const json = loadGraphJson(projectId);
    if (json) return json;
  }
  const graph = initProjectGraph(projectId, "\u672A\u547D\u540D\u9879\u76EE");
  persistGraph(graph);
  return graph;
}
function deleteGraph(projectId) {
  if (graphStoreBackend() === "sqlite") {
    sqliteDeleteGraph(projectId);
  }
  const fp = jsonGraphPath(projectId);
  if (fs4.existsSync(fp)) fs4.unlinkSync(fp);
}
function queryGraph(projectId, opts) {
  const graph = loadGraph(projectId);
  if (!opts.type && !opts.refId) return graph;
  const nodes = graph.nodes.filter((n) => {
    if (opts.type && n.type !== opts.type) return false;
    if (opts.refId && n.refId !== opts.refId) return false;
    return true;
  });
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => nodeIds.has(e.from) || nodeIds.has(e.to));
  return { projectId, nodes, edges, updatedAt: graph.updatedAt };
}
function initGraphForProject(projectId, title) {
  const graph = initProjectGraph(projectId, title);
  persistGraph(graph);
  return graph;
}
function graphSyncBrief(projectId, brief) {
  let graph = syncBriefToGraph(loadGraph(projectId), projectId, brief);
  graph = withDatasetLink(graph, projectId, [brief.tone, brief.references]);
  persistGraph(graph);
  return graph;
}
function graphSyncCapture(projectId, capture) {
  let graph = syncCaptureToGraph(loadGraph(projectId), projectId, capture);
  graph = withDatasetLink(graph, projectId, [capture.title, capture.platform ?? ""]);
  persistGraph(graph);
  return graph;
}
function graphSyncImageAnalysis(projectId, captureId, analysis) {
  let graph = syncImageAnalysisToGraph(loadGraph(projectId), projectId, captureId, analysis);
  graph = withDatasetLink(graph, projectId, [
    analysis.artStyle,
    analysis.mood,
    ...analysis.techniques
  ]);
  persistGraph(graph);
  return graph;
}
function graphSyncVideoAnalysis(projectId, captureId, analysis) {
  let graph = syncVideoAnalysisToGraph(loadGraph(projectId), projectId, captureId, analysis);
  graph = withDatasetLink(graph, projectId, [
    analysis.filmStyle,
    analysis.colorGrading,
    ...analysis.overallKeywords
  ]);
  persistGraph(graph);
  return graph;
}
function graphSyncStyleGuide(projectId, style) {
  let graph = syncStyleGuideToGraph(loadGraph(projectId), projectId, style);
  graph = withDatasetLink(graph, projectId, [...style.keywords, ...style.moodTags]);
  persistGraph(graph);
  return graph;
}
function graphRebuildFromProject(project) {
  let graph = initProjectGraph(project.id, project.title);
  graph = syncBriefToGraph(graph, project.id, project.brief);
  for (const capture of [...project.captures].reverse()) {
    graph = syncCaptureToGraph(graph, project.id, capture);
  }
  graph = syncStyleGuideToGraph(graph, project.id, project.styleGuide);
  graph = withDatasetLink(graph, project.id);
  persistGraph(graph);
  return graph;
}
function exportGraphJson(projectId) {
  return JSON.stringify(loadGraph(projectId), null, 2);
}
function buildProjectDocumentFromGraph(project) {
  const graph = loadGraph(project.id);
  return buildDocumentFromGraph(graph, project);
}
function getGraphStoreInfo() {
  return { backend: graphStoreBackend(), dataDir: DATA_DIR2 };
}

// knowgo/web/backend/src/store.ts
import fs5 from "node:fs";
import path5 from "node:path";
var DATA_DIR3 = process.env.VERCEL ? path5.join("/tmp", "everec-knowgo") : path5.join(process.cwd(), "data", "knowgo");
var PROJECTS_FILE = path5.join(DATA_DIR3, "projects.json");
var MEDIA_DIR = path5.join(DATA_DIR3, "media");
function ensureDirs() {
  fs5.mkdirSync(MEDIA_DIR, { recursive: true });
  if (!fs5.existsSync(PROJECTS_FILE)) {
    fs5.writeFileSync(PROJECTS_FILE, "[]", "utf-8");
  }
}
function readProjects() {
  ensureDirs();
  return JSON.parse(fs5.readFileSync(PROJECTS_FILE, "utf-8"));
}
function writeProjects(projects) {
  ensureDirs();
  fs5.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
}
function listProjects() {
  return readProjects().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
function getProject(id) {
  return readProjects().find((p) => p.id === id);
}
function createProject(title = "\u672A\u547D\u540D\u9879\u76EE") {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const project = {
    id: v4_default(),
    title,
    brief: { ...DEFAULT_BRIEF, title },
    captures: [],
    document: { ...DEFAULT_DOCUMENT, updatedAt: now },
    styleGuide: { ...DEFAULT_STYLE_GUIDE },
    createdAt: now,
    updatedAt: now
  };
  const projects = readProjects();
  projects.push(project);
  writeProjects(projects);
  initGraphForProject(project.id, title);
  return project;
}
function updateProject(id, patch) {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx < 0) return void 0;
  projects[idx] = {
    ...projects[idx],
    ...patch,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  writeProjects(projects);
  const updated = projects[idx];
  if (patch.brief) graphSyncBrief(id, updated.brief);
  if (patch.styleGuide) graphSyncStyleGuide(id, updated.styleGuide);
  return updated;
}
function deleteProject(id) {
  const projects = readProjects();
  const next = projects.filter((p) => p.id !== id);
  if (next.length === projects.length) return false;
  writeProjects(next);
  deleteGraph(id);
  return true;
}
function addCapture(projectId, capture) {
  const project = getProject(projectId);
  if (!project) return void 0;
  const item = {
    ...capture,
    id: v4_default(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  project.captures.unshift(item);
  updateProject(projectId, { captures: project.captures });
  graphSyncCapture(projectId, item);
  return item;
}
function saveMediaBuffer(buffer, ext) {
  ensureDirs();
  const fileName = `${v4_default()}.${ext}`;
  const filePath = path5.join(MEDIA_DIR, fileName);
  fs5.writeFileSync(filePath, buffer);
  return { fileName, filePath };
}
function getMediaPath(fileName) {
  ensureDirs();
  const fp = path5.join(MEDIA_DIR, fileName);
  return fs5.existsSync(fp) ? fp : void 0;
}

// knowgo/web/backend/src/app.ts
var app2 = new Hono2().basePath("/api/knowgo");
app2.use("*", cors());
app2.onError((err, c) => {
  console.error("[knowgo api error]", err);
  return c.json({ error: err.message || "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF" }, 500);
});
app2.get("/health", (c) => {
  const graph = getGraphStoreInfo();
  return c.json({ ok: true, product: "knowgo", platform: "web", graphStore: graph.backend });
});
app2.get("/style-dataset", (c) => {
  const category = c.req.query("category");
  return c.json(listStyleDataset(category));
});
app2.get("/projects", (c) => c.json(listProjects()));
app2.post("/projects", async (c) => {
  const { title } = await c.req.json().catch(() => ({ title: void 0 }));
  return c.json(createProject(title));
});
app2.get("/projects/:id", (c) => {
  const project = getProject(c.req.param("id"));
  if (!project) return c.json({ error: "not found" }, 404);
  return c.json(project);
});
app2.patch("/projects/:id", async (c) => {
  const patch = await c.req.json();
  const updated = updateProject(c.req.param("id"), patch);
  if (!updated) return c.json({ error: "not found" }, 404);
  return c.json(updated);
});
app2.delete("/projects/:id", (c) => {
  const ok = deleteProject(c.req.param("id"));
  if (!ok) return c.json({ error: "not found" }, 404);
  return c.json({ ok: true });
});
app2.get("/projects/:id/graph", (c) => {
  const project = getProject(c.req.param("id"));
  if (!project) return c.json({ error: "not found" }, 404);
  const graph = loadGraph(c.req.param("id"));
  const layout = computeGraphLayout(graph);
  return c.json({ graph, layout });
});
app2.get("/projects/:id/graph/query", (c) => {
  const project = getProject(c.req.param("id"));
  if (!project) return c.json({ error: "not found" }, 404);
  const type = c.req.query("type");
  const refId = c.req.query("refId");
  return c.json(queryGraph(c.req.param("id"), { type, refId }));
});
app2.post("/projects/:id/graph/rebuild", (c) => {
  const project = getProject(c.req.param("id"));
  if (!project) return c.json({ error: "not found" }, 404);
  const graph = graphRebuildFromProject(project);
  return c.json({ graph, layout: computeGraphLayout(graph) });
});
app2.get("/projects/:id/graph/export", (c) => {
  const project = getProject(c.req.param("id"));
  if (!project) return c.json({ error: "not found" }, 404);
  c.header("Content-Type", "application/json");
  c.header("Content-Disposition", `attachment; filename="knowgo-graph-${project.id}.json"`);
  return c.body(exportGraphJson(project.id));
});
app2.post("/projects/:id/document/from-graph", async (c) => {
  const project = getProject(c.req.param("id"));
  if (!project) return c.json({ error: "not found" }, 404);
  const document = buildProjectDocumentFromGraph(project);
  const updated = updateProject(project.id, { document });
  if (!updated) return c.json({ error: "update failed" }, 500);
  return c.json({ document, project: updated });
});
app2.post("/parse-url", async (c) => {
  const { url } = await c.req.json();
  if (!url?.trim()) return c.json({ error: "\u8BF7\u63D0\u4F9B URL" }, 400);
  const result = await parseWebUrl(url.trim());
  return c.json(result);
});
app2.post("/projects/:id/captures/url", async (c) => {
  const { url } = await c.req.json();
  if (!url?.trim()) return c.json({ error: "\u8BF7\u63D0\u4F9B URL" }, 400);
  const parsed = await parseWebUrl(url.trim());
  const capture = addCapture(c.req.param("id"), {
    type: parsed.mediaType === "video" && parsed.videoUrl ? "video" : "url",
    sourceUrl: parsed.resolvedUrl ?? parsed.url,
    previewUrl: parsed.imageUrl,
    videoUrl: parsed.videoUrl,
    title: parsed.title,
    description: parsed.description,
    platform: parsed.platform,
    author: parsed.author,
    mediaType: parsed.mediaType
  });
  if (!capture) return c.json({ error: "project not found" }, 404);
  return c.json(capture);
});
app2.post("/projects/:id/captures/upload", async (c) => {
  const projectId = c.req.param("id");
  const body = await c.req.parseBody();
  const file = body.file;
  if (!file || typeof file === "string") {
    return c.json({ error: "\u8BF7\u4E0A\u4F20\u6587\u4EF6" }, 400);
  }
  const f = file;
  const original = f.name ?? "upload";
  const ext = path6.extname(original).slice(1).toLowerCase() || "bin";
  const buffer = Buffer.from(await f.arrayBuffer());
  const { fileName } = saveMediaBuffer(buffer, ext);
  const isVideo = ["mp4", "webm", "mov", "mkv"].includes(ext);
  const capture = addCapture(projectId, {
    type: isVideo ? "video" : "image",
    fileName,
    previewUrl: `/api/knowgo/media/${fileName}`,
    title: path6.basename(original, path6.extname(original)),
    description: isVideo ? "\u4E0A\u4F20\u7684\u89C6\u9891\u7D20\u6750" : "\u4E0A\u4F20\u7684\u56FE\u7247\u7D20\u6750"
  });
  if (!capture) return c.json({ error: "project not found" }, 404);
  return c.json(capture);
});
app2.get("/media/:fileName", (c) => {
  const fp = getMediaPath(c.req.param("fileName"));
  if (!fp) return c.json({ error: "not found" }, 404);
  const ext = path6.extname(fp).slice(1).toLowerCase();
  const mimeMap = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime"
  };
  const data = fs6.readFileSync(fp);
  c.header("Content-Type", mimeMap[ext] ?? "application/octet-stream");
  c.header("Cache-Control", "public, max-age=3600");
  return c.body(data);
});
app2.post("/analyze/image", async (c) => {
  const body = await c.req.parseBody();
  const captureId = String(body.captureId ?? "");
  const projectId = String(body.projectId ?? "");
  const hint = String(body.hint ?? "");
  const apiKey = body.apiKey ? String(body.apiKey) : void 0;
  const file = body.file;
  if (!captureId) return c.json({ error: "\u7F3A\u5C11 captureId" }, 400);
  let result;
  if (file && typeof file !== "string") {
    const f = file;
    const buffer = Buffer.from(await f.arrayBuffer());
    const ext = path6.extname(f.name ?? "").slice(1).toLowerCase();
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : "image/jpeg";
    result = await analyzeImage(captureId, buffer, mime, hint, apiKey);
  } else {
    const fileName = String(body.fileName ?? "");
    if (fileName) {
      const fp = getMediaPath(fileName);
      if (!fp) return c.json({ error: "\u6587\u4EF6\u4E0D\u5B58\u5728" }, 400);
      const ext = path6.extname(fp).slice(1).toLowerCase();
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      const buffer = fs6.readFileSync(fp);
      result = await analyzeImage(captureId, buffer, mime, hint, apiKey);
    } else {
      result = analyzeImageLocal(captureId, hint);
    }
  }
  if (projectId) {
    graphSyncImageAnalysis(projectId, captureId, result);
  }
  return c.json(result);
});
app2.post("/analyze/video", async (c) => {
  const { captureId, projectId, durationSec, hint, apiKey } = await c.req.json();
  if (!captureId) return c.json({ error: "\u7F3A\u5C11 captureId" }, 400);
  const result = await analyzeVideo(
    captureId,
    durationSec ?? 60,
    hint ?? "",
    apiKey
  );
  if (projectId) {
    graphSyncVideoAnalysis(projectId, captureId, result);
  }
  return c.json(result);
});
app2.post("/analyze/style", async (c) => {
  const { hint, keywords, projectId } = await c.req.json();
  const guide = buildStyleGuide(hint ?? "", keywords ?? []);
  if (projectId) {
    graphSyncStyleGuide(projectId, guide);
  }
  return c.json(guide);
});
var app_default2 = app2;

// prerector/web/backend/src/store.ts
import fs7 from "node:fs";
import path7 from "node:path";

// prerector/web/backend/src/taskAssessment.ts
var EASY_KEYWORDS = /简单|基础|整理|归档|文档|常规|例行|copy|简单修改/i;
var HARD_KEYWORDS = /复杂|架构|集成|全栈|4k|多机位|重构|从零|核心|关键路径|高难度/i;
var MEDIUM_KEYWORDS = /设计|开发|剪辑|混音|调色|测试|评审|联调/i;
function assessDifficulty(title, description, brief, projectType, scope, template) {
  let score = template?.baseDifficulty ?? 3;
  const text = `${title} ${description} ${brief}`.toLowerCase();
  if (template?.keywords.some((k) => text.includes(k.toLowerCase()))) {
    score = Math.min(5, score + 1);
  }
  if (EASY_KEYWORDS.test(text)) score = Math.max(1, score - 1);
  if (HARD_KEYWORDS.test(text)) score = Math.min(5, score + 1);
  if (MEDIUM_KEYWORDS.test(text) && score < 3) score = 3;
  const scopeDefault = SCOPE_LABELS[projectType].default;
  if (scope > scopeDefault * 2) score = Math.min(5, score + 1);
  if (scope > scopeDefault * 4) score = Math.min(5, score + 1);
  if (projectType === "video" && /4k|raw|多机位/.test(text)) {
    score = Math.min(5, score + 1);
  }
  return Math.max(1, Math.min(5, score));
}
function assessHours(difficulty, projectType, scope, template) {
  const base = template?.baseHours ?? 4 + difficulty;
  const scopeDefault = SCOPE_LABELS[projectType].default;
  const scopeFactor = 0.8 + scope / scopeDefault;
  const difficultyFactor = 0.65 + difficulty * 0.18;
  return Math.round(base * scopeFactor * difficultyFactor * 10) / 10;
}
function assessCustomTask(task, brief, projectType, scope) {
  const difficulty = assessDifficulty(task.title, task.description, brief, projectType, scope);
  const estimatedHours = assessHours(difficulty, projectType, scope);
  return { difficulty, estimatedHours };
}
function assessTemplateTask(template, brief, projectType, scope) {
  const difficulty = assessDifficulty(
    template.title,
    template.description,
    brief,
    projectType,
    scope,
    template
  );
  const estimatedHours = assessHours(difficulty, projectType, scope, template);
  return { difficulty, estimatedHours };
}

// prerector/web/backend/src/taskTemplates.ts
var TEMPLATES_BY_TYPE = {
  video: [
    { title: "\u521B\u610F\u7B56\u5212\u4E0E Brief", phase: "\u524D\u671F", description: "\u660E\u786E\u76EE\u6807\u53D7\u4F17\u3001\u98CE\u683C\u53C2\u8003\u4E0E\u4EA4\u4ED8\u89C4\u683C", baseHours: 4, baseDifficulty: 2, keywords: ["\u7B56\u5212", "brief", "\u521B\u610F"] },
    { title: "\u811A\u672C\u64B0\u5199", phase: "\u524D\u671F", description: "\u5B8C\u6210\u65C1\u767D/\u5BF9\u767D\u811A\u672C\u4E0E\u753B\u9762\u63CF\u8FF0", baseHours: 6, baseDifficulty: 3, keywords: ["\u811A\u672C", "\u6587\u6848", "\u65C1\u767D"] },
    { title: "\u5206\u955C\u8BBE\u8BA1", phase: "\u524D\u671F", description: "\u955C\u5934\u8BED\u8A00\u3001\u8F6C\u573A\u4E0E\u8282\u594F\u89C4\u5212", baseHours: 8, baseDifficulty: 3, keywords: ["\u5206\u955C", "storyboard"] },
    { title: "\u7D20\u6750\u62CD\u6444/\u91C7\u96C6", phase: "\u5236\u4F5C", description: "\u6309\u5206\u955C\u5B8C\u6210\u62CD\u6444\u6216\u7D20\u6750\u6536\u96C6", baseHours: 16, baseDifficulty: 4, keywords: ["\u62CD\u6444", "\u91C7\u96C6", "\u5F55\u5236"] },
    { title: "\u7D20\u6750\u6574\u7406\u4E0E\u4EE3\u7406\u751F\u6210", phase: "\u5236\u4F5C", description: "\u5206\u7C7B\u5E76\u751F\u6210\u4F4E\u7801\u7387\u4EE3\u7406\u6587\u4EF6", baseHours: 3, baseDifficulty: 2, keywords: ["\u6574\u7406", "\u4EE3\u7406", "proxy"] },
    { title: "\u7C97\u526A", phase: "\u540E\u671F", description: "\u642D\u5EFA\u65F6\u95F4\u8F74\u7ED3\u6784\uFF0C\u786E\u5B9A\u53D9\u4E8B\u8282\u594F", baseHours: 8, baseDifficulty: 3, keywords: ["\u7C97\u526A", "assembly"] },
    { title: "\u7CBE\u526A", phase: "\u540E\u671F", description: "\u7CBE\u7EC6\u526A\u8F91\u3001\u8F6C\u573A\u4E0E\u8282\u594F\u5FAE\u8C03", baseHours: 12, baseDifficulty: 4, keywords: ["\u7CBE\u526A", "\u526A\u8F91", "\u8F6C\u573A"] },
    { title: "\u8C03\u8272", phase: "\u540E\u671F", description: "\u8272\u5F69\u6821\u6B63\u4E0E\u98CE\u683C LUT \u5E94\u7528", baseHours: 6, baseDifficulty: 4, keywords: ["\u8C03\u8272", "color", "lut"] },
    { title: "\u5B57\u5E55\u4E0E\u5305\u88C5", phase: "\u540E\u671F", description: "\u5B57\u5E55\u3001\u6807\u9898\u52A8\u753B\u4E0E\u54C1\u724C\u5305\u88C5", baseHours: 5, baseDifficulty: 3, keywords: ["\u5B57\u5E55", "\u5305\u88C5"] },
    { title: "\u97F3\u6548\u4E0E\u6DF7\u97F3", phase: "\u540E\u671F", description: "BGM\u3001\u62DF\u58F0\u4E0E\u6DF7\u97F3\u5E73\u8861", baseHours: 6, baseDifficulty: 3, keywords: ["\u97F3\u6548", "\u6DF7\u97F3", "bgm"] },
    { title: "\u5BA1\u7247\u4E0E\u4FEE\u6539", phase: "\u4EA4\u4ED8", description: "\u5185\u90E8\u5BA1\u7247\u3001\u5BA2\u6237\u53CD\u9988\u4E0E\u4FEE\u6539\u8F6E\u6B21", baseHours: 4, baseDifficulty: 2, keywords: ["\u5BA1\u7247", "\u53CD\u9988", "review"] },
    { title: "\u5BFC\u51FA\u4E0E\u4EA4\u4ED8", phase: "\u4EA4\u4ED8", description: "\u591A\u89C4\u683C\u5BFC\u51FA\u3001\u5F52\u6863\u4E0E\u5907\u4EFD", baseHours: 2, baseDifficulty: 1, keywords: ["\u5BFC\u51FA", "\u4EA4\u4ED8"] }
  ],
  audio: [
    { title: "\u58F0\u97F3\u65B9\u5411\u4E0E\u53C2\u8003", phase: "\u524D\u671F", description: "\u786E\u5B9A\u98CE\u683C\u53C2\u8003\u3001\u60C5\u7EEA\u4E0E\u4EA4\u4ED8\u683C\u5F0F", baseHours: 3, baseDifficulty: 2, keywords: ["\u53C2\u8003", "\u98CE\u683C", "mood"] },
    { title: "\u7D20\u6750\u91C7\u96C6/\u5F55\u97F3", phase: "\u5236\u4F5C", description: "\u73B0\u573A\u5F55\u97F3\u3001\u62DF\u58F0\u6216\u7D20\u6750\u5E93\u9009\u578B", baseHours: 8, baseDifficulty: 3, keywords: ["\u5F55\u97F3", "\u62DF\u58F0", "foley"] },
    { title: "\u7F16\u66F2/\u94FA\u5E95", phase: "\u5236\u4F5C", description: "BGM \u7ED3\u6784\u3001\u548C\u58F0\u4E0E\u8282\u594F\u6846\u67B6", baseHours: 10, baseDifficulty: 4, keywords: ["\u7F16\u66F2", "bgm", "compose"] },
    { title: "\u6DF7\u97F3", phase: "\u540E\u671F", description: "\u8F68\u9053\u8DEF\u7531\u3001EQ\u3001\u538B\u7F29\u4E0E\u7A7A\u95F4", baseHours: 8, baseDifficulty: 4, keywords: ["\u6DF7\u97F3", "mix", "eq"] },
    { title: "\u6BCD\u5E26/\u5BFC\u51FA", phase: "\u4EA4\u4ED8", description: "\u54CD\u5EA6\u6807\u51C6\u5316\u3001\u591A\u683C\u5F0F\u5BFC\u51FA", baseHours: 3, baseDifficulty: 2, keywords: ["\u6BCD\u5E26", "master", "\u5BFC\u51FA"] }
  ],
  design: [
    { title: "\u9700\u6C42\u4E0E\u8C03\u7814", phase: "\u524D\u671F", description: "\u7528\u6237\u7814\u7A76\u3001\u7ADE\u54C1\u5206\u6790\u4E0E\u8BBE\u8BA1\u76EE\u6807", baseHours: 6, baseDifficulty: 2, keywords: ["\u8C03\u7814", "\u7528\u6237", "research"] },
    { title: "\u4FE1\u606F\u67B6\u6784", phase: "\u524D\u671F", description: "\u6D41\u7A0B\u3001\u5BFC\u822A\u4E0E\u5185\u5BB9\u7ED3\u6784", baseHours: 5, baseDifficulty: 3, keywords: ["\u67B6\u6784", "\u6D41\u7A0B", "wireflow"] },
    { title: "\u7EBF\u6846/\u539F\u578B", phase: "\u8BBE\u8BA1", description: "\u4F4E\u4FDD\u771F\u7EBF\u6846\u4E0E\u4EA4\u4E92\u539F\u578B", baseHours: 8, baseDifficulty: 3, keywords: ["\u7EBF\u6846", "\u539F\u578B", "wireframe"] },
    { title: "\u89C6\u89C9\u8BBE\u8BA1", phase: "\u8BBE\u8BA1", description: "\u89C6\u89C9\u89C4\u8303\u3001\u7EC4\u4EF6\u4E0E\u5173\u952E\u9875\u9762", baseHours: 12, baseDifficulty: 4, keywords: ["\u89C6\u89C9", "ui", "\u754C\u9762"] },
    { title: "\u8BBE\u8BA1\u8D70\u67E5\u4E0E\u4EA4\u4ED8", phase: "\u4EA4\u4ED8", description: "\u6807\u6CE8\u3001\u5207\u56FE\u4E0E\u8BBE\u8BA1\u7CFB\u7EDF\u6587\u6863", baseHours: 4, baseDifficulty: 2, keywords: ["\u4EA4\u4ED8", "\u6807\u6CE8", "handoff"] }
  ],
  software: [
    { title: "\u9700\u6C42\u5206\u6790", phase: "\u524D\u671F", description: "\u529F\u80FD\u6E05\u5355\u3001\u4F18\u5148\u7EA7\u4E0E\u9A8C\u6536\u6807\u51C6", baseHours: 6, baseDifficulty: 3, keywords: ["\u9700\u6C42", "prd", "\u529F\u80FD"] },
    { title: "\u6280\u672F\u65B9\u6848", phase: "\u524D\u671F", description: "\u67B6\u6784\u8BBE\u8BA1\u3001\u6280\u672F\u9009\u578B\u4E0E\u63A5\u53E3\u5B9A\u4E49", baseHours: 8, baseDifficulty: 4, keywords: ["\u67B6\u6784", "api", "\u6280\u672F"] },
    { title: "\u5F00\u53D1\u5B9E\u73B0", phase: "\u5F00\u53D1", description: "\u6838\u5FC3\u529F\u80FD\u7F16\u7801\u4E0E\u5355\u5143\u6D4B\u8BD5", baseHours: 24, baseDifficulty: 4, keywords: ["\u5F00\u53D1", "\u7F16\u7801", "implement"] },
    { title: "\u8054\u8C03\u4E0E\u6D4B\u8BD5", phase: "\u6D4B\u8BD5", description: "\u96C6\u6210\u6D4B\u8BD5\u3001Bug \u4FEE\u590D\u4E0E\u6027\u80FD\u4F18\u5316", baseHours: 10, baseDifficulty: 3, keywords: ["\u6D4B\u8BD5", "\u8054\u8C03", "qa"] },
    { title: "\u90E8\u7F72\u4E0E\u6587\u6863", phase: "\u4EA4\u4ED8", description: "\u4E0A\u7EBF\u90E8\u7F72\u3001\u8FD0\u7EF4\u6587\u6863\u4E0E\u4EA4\u63A5", baseHours: 4, baseDifficulty: 2, keywords: ["\u90E8\u7F72", "\u4E0A\u7EBF", "\u6587\u6863"] }
  ],
  campaign: [
    { title: "\u7B56\u7565\u4E0E\u76EE\u6807", phase: "\u7B56\u5212", description: "KPI\u3001\u53D7\u4F17\u753B\u50CF\u4E0E\u6E20\u9053\u7B56\u7565", baseHours: 5, baseDifficulty: 2, keywords: ["\u7B56\u7565", "kpi", "\u76EE\u6807"] },
    { title: "\u5185\u5BB9\u89C4\u5212", phase: "\u7B56\u5212", description: "\u5185\u5BB9\u65E5\u5386\u3001\u7D20\u6750\u6E05\u5355\u4E0E\u5206\u5DE5", baseHours: 6, baseDifficulty: 3, keywords: ["\u5185\u5BB9", "\u65E5\u5386", "\u89C4\u5212"] },
    { title: "\u7D20\u6750\u5236\u4F5C", phase: "\u6267\u884C", description: "\u56FE\u6587/\u89C6\u9891/\u843D\u5730\u9875\u7B49\u7D20\u6750\u4EA7\u51FA", baseHours: 16, baseDifficulty: 4, keywords: ["\u7D20\u6750", "\u5236\u4F5C", "\u521B\u610F"] },
    { title: "\u6E20\u9053\u6295\u653E", phase: "\u6267\u884C", description: "\u5E73\u53F0\u914D\u7F6E\u3001\u6295\u653E\u4E0E A/B \u6D4B\u8BD5", baseHours: 8, baseDifficulty: 3, keywords: ["\u6295\u653E", "\u5E7F\u544A", "\u6E20\u9053"] },
    { title: "\u6570\u636E\u590D\u76D8", phase: "\u590D\u76D8", description: "\u6548\u679C\u5206\u6790\u3001\u62A5\u544A\u4E0E\u4F18\u5316\u5EFA\u8BAE", baseHours: 4, baseDifficulty: 2, keywords: ["\u590D\u76D8", "\u6570\u636E", "\u62A5\u544A"] }
  ],
  general: [
    { title: "\u9879\u76EE\u542F\u52A8", phase: "\u542F\u52A8", description: "\u76EE\u6807\u5BF9\u9F50\u3001\u8303\u56F4\u786E\u8BA4\u4E0E\u91CC\u7A0B\u7891", baseHours: 3, baseDifficulty: 1, keywords: ["\u542F\u52A8", "kickoff"] },
    { title: "\u65B9\u6848\u89C4\u5212", phase: "\u89C4\u5212", description: "\u4EFB\u52A1\u5206\u89E3\u3001\u8D44\u6E90\u4E0E\u98CE\u9669\u8BC6\u522B", baseHours: 5, baseDifficulty: 2, keywords: ["\u89C4\u5212", "\u65B9\u6848", "\u8BA1\u5212"] },
    { title: "\u6267\u884C\u63A8\u8FDB", phase: "\u6267\u884C", description: "\u6838\u5FC3\u4EA4\u4ED8\u7269\u5236\u4F5C\u4E0E\u534F\u4F5C", baseHours: 16, baseDifficulty: 3, keywords: ["\u6267\u884C", "\u63A8\u8FDB", "\u5236\u4F5C"] },
    { title: "\u8BC4\u5BA1\u4FEE\u6539", phase: "\u8BC4\u5BA1", description: "\u5185\u90E8\u8BC4\u5BA1\u3001\u53CD\u9988\u6536\u96C6\u4E0E\u8FED\u4EE3", baseHours: 4, baseDifficulty: 2, keywords: ["\u8BC4\u5BA1", "\u53CD\u9988", "\u4FEE\u6539"] },
    { title: "\u9A8C\u6536\u4EA4\u4ED8", phase: "\u4EA4\u4ED8", description: "\u6700\u7EC8\u9A8C\u6536\u3001\u5F52\u6863\u4E0E\u603B\u7ED3", baseHours: 2, baseDifficulty: 1, keywords: ["\u9A8C\u6536", "\u4EA4\u4ED8", "\u603B\u7ED3"] }
  ],
  homework: [
    { title: "\u9009\u9898\u4E0E\u5C0F\u7EC4\u5206\u5DE5", phase: "\u542F\u52A8", description: "\u786E\u5B9A\u4F5C\u4E1A\u9898\u76EE\u3001\u89D2\u8272\u4E0E\u622A\u6B62\u65F6\u95F4", baseHours: 2, baseDifficulty: 2, keywords: ["\u5206\u5DE5", "\u9009\u9898", "\u5C0F\u7EC4"] },
    { title: "\u8D44\u6599\u8C03\u7814", phase: "\u8C03\u7814", description: "\u6587\u732E\u3001\u6848\u4F8B\u4E0E\u53C2\u8003\u8D44\u6599\u6536\u96C6\u6574\u7406", baseHours: 6, baseDifficulty: 2, keywords: ["\u8C03\u7814", "\u6587\u732E", "\u8D44\u6599"] },
    { title: "\u4E2A\u4EBA\u90E8\u5206\u64B0\u5199", phase: "\u6267\u884C", description: "\u5404\u6210\u5458\u5B8C\u6210\u8D1F\u8D23\u7AE0\u8282\u6216\u6A21\u5757", baseHours: 10, baseDifficulty: 3, keywords: ["\u64B0\u5199", "\u7AE0\u8282", "\u4E2A\u4EBA"] },
    { title: "\u5408\u5E76\u4E0E\u7EDF\u7A3F", phase: "\u534F\u4F5C", description: "\u6C47\u603B\u5185\u5BB9\u3001\u7EDF\u4E00\u683C\u5F0F\u4E0E\u903B\u8F91", baseHours: 5, baseDifficulty: 3, keywords: ["\u5408\u5E76", "\u7EDF\u7A3F", "\u683C\u5F0F"] },
    { title: "\u4E92\u8BC4\u4E0E\u4FEE\u6539", phase: "\u8BC4\u5BA1", description: "\u7EC4\u5185\u4E92\u5BA1\u3001\u6839\u636E\u53CD\u9988\u8FED\u4EE3", baseHours: 4, baseDifficulty: 2, keywords: ["\u4E92\u8BC4", "\u4FEE\u6539", "\u53CD\u9988"] },
    { title: "\u7B54\u8FA9/\u5C55\u793A\u51C6\u5907", phase: "\u8BC4\u5BA1", description: "PPT\u3001\u6F14\u8BB2\u7A3F\u4E0E\u6F14\u793A\u6392\u7EC3", baseHours: 4, baseDifficulty: 3, keywords: ["\u7B54\u8FA9", "\u5C55\u793A", "ppt"] },
    { title: "\u63D0\u4EA4\u4E0E\u9A8C\u6536", phase: "\u4EA4\u4ED8", description: "\u6700\u7EC8\u63D0\u4EA4\u3001\u67E5\u91CD\u4E0E\u786E\u8BA4", baseHours: 2, baseDifficulty: 1, keywords: ["\u63D0\u4EA4", "deadline", "\u9A8C\u6536"] }
  ]
};
var TYPE_KEYWORDS = {
  video: [/视频|剪辑|拍摄|分镜|调色|字幕|宣传片|mv|footage|4k|成片/i],
  audio: [/音频|声音|混音|编曲|bgm|拟声|foley|录音|母带|podcast/i],
  design: [/设计|ui|ux|界面|视觉|原型|线框|figma|品牌/i],
  software: [/开发|软件|api|后端|前端|系统|app|代码|功能模块/i],
  campaign: [/营销|活动|投放|推广|campaign|广告|社媒|品牌传播/i],
  homework: [/作业|课程|小组|论文|报告|presentation|assignment|groupwork|期末|大作业/i],
  general: []
};
function detectProjectType(brief, hint) {
  if (hint && hint !== "auto") return hint;
  const scores = {
    video: 0,
    audio: 0,
    design: 0,
    software: 0,
    campaign: 0,
    homework: 0,
    general: 0
  };
  for (const [type, patterns] of Object.entries(TYPE_KEYWORDS)) {
    for (const re of patterns) {
      if (re.test(brief)) scores[type] += 2;
    }
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "general";
}
function parseTaskInput(input) {
  const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const cleaned = line.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "");
    const [title, ...descParts] = cleaned.split("|").map((s) => s.trim());
    const description = descParts.join(" | ") || "\u81EA\u5B9A\u4E49\u4EFB\u52A1";
    const phase = inferPhase(title, description);
    return { title: title || "\u672A\u547D\u540D\u4EFB\u52A1", description, phase };
  });
}
function inferPhase(title, description) {
  const text = `${title} ${description}`;
  if (/启动|kickoff|brief|策划|需求|调研|前期|选题/.test(text)) return "\u524D\u671F";
  if (/设计|原型|线框|视觉|ui/.test(text)) return "\u8BBE\u8BA1";
  if (/开发|编码|实现|制作|拍摄|录音|撰写/.test(text)) return "\u6267\u884C";
  if (/测试|联调|qa|审片|评审|互评|答辩/.test(text)) return "\u8BC4\u5BA1";
  if (/部署|交付|导出|上线|验收|复盘|提交/.test(text)) return "\u4EA4\u4ED8";
  if (/合并|统稿|协作|分工/.test(text)) return "\u534F\u4F5C";
  return "\u6267\u884C";
}

// prerector/web/backend/src/taskEngine.ts
var ROLE_PHASE_MAP = {
  director: ["\u524D\u671F", "\u7B56\u5212", "\u542F\u52A8", "\u89C4\u5212", "\u5236\u4F5C", "\u6267\u884C"],
  producer: ["\u524D\u671F", "\u7B56\u5212", "\u542F\u52A8", "\u4EA4\u4ED8", "\u590D\u76D8", "\u8BC4\u5BA1"],
  editor: ["\u540E\u671F", "\u5236\u4F5C", "\u6267\u884C", "\u5F00\u53D1", "\u8BBE\u8BA1"],
  colorist: ["\u540E\u671F", "\u8BBE\u8BA1"],
  sound: ["\u540E\u671F", "\u5236\u4F5C"],
  other: ["\u524D\u671F", "\u7B56\u5212", "\u542F\u52A8", "\u89C4\u5212", "\u5236\u4F5C", "\u6267\u884C", "\u540E\u671F", "\u8BBE\u8BA1", "\u5F00\u53D1", "\u6D4B\u8BD5", "\u8BC4\u5BA1", "\u4EA4\u4ED8", "\u590D\u76D8", "\u8C03\u7814", "\u534F\u4F5C"]
};
function pickAssignee(team, phase, index) {
  if (!team || team.members.length === 0) return void 0;
  const eligible = team.members.filter(
    (m) => (ROLE_PHASE_MAP[m.role] ?? ROLE_PHASE_MAP.other).includes(phase)
  );
  const pool = eligible.length > 0 ? eligible : team.members;
  return pool[index % pool.length].id;
}
function extractProjectName(brief) {
  const firstLine = brief.split("\n")[0]?.trim() ?? "";
  if (firstLine.length > 0 && firstLine.length <= 60) return firstLine;
  return `\u9879\u76EE ${(/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN")}`;
}
function resolveScope(req, projectType) {
  return req.scope ?? req.videoDurationMin ?? SCOPE_LABELS[projectType].default;
}
function decomposeProject(req, team) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const projectType = detectProjectType(req.brief, req.projectType);
  const scope = resolveScope(req, projectType);
  const scopeMeta = SCOPE_LABELS[projectType];
  const customTasks = req.taskInput?.trim() ? parseTaskInput(req.taskInput) : [];
  const project = {
    id: v4_default(),
    name: extractProjectName(req.brief),
    brief: req.brief,
    projectType,
    scope,
    scopeUnit: scopeMeta.unit,
    teamId: req.teamId,
    createdAt: now
  };
  const taskSpecs = customTasks.length > 0 ? customTasks.map((t) => {
    const { difficulty, estimatedHours } = assessCustomTask(t, req.brief, projectType, scope);
    return {
      title: t.title,
      description: t.description,
      phase: t.phase,
      difficulty,
      estimatedHours
    };
  }) : TEMPLATES_BY_TYPE[projectType].map((tpl) => {
    const { difficulty, estimatedHours } = assessTemplateTask(tpl, req.brief, projectType, scope);
    return {
      title: tpl.title,
      description: tpl.description,
      phase: tpl.phase,
      difficulty,
      estimatedHours
    };
  });
  const tasks = taskSpecs.map((spec, i) => {
    const dueOffsetDays = Math.max(1, Math.ceil((i + 1) * (spec.estimatedHours / 8)));
    return {
      id: v4_default(),
      projectId: project.id,
      title: spec.title,
      description: spec.description,
      phase: spec.phase,
      status: i === 0 ? "in_progress" : "todo",
      difficulty: spec.difficulty,
      estimatedHours: spec.estimatedHours,
      assigneeId: pickAssignee(team, spec.phase, i),
      dueAt: new Date(Date.now() + dueOffsetDays * 864e5).toISOString(),
      createdAt: now
    };
  });
  return { project, tasks };
}
function rebalanceAssignments(tasks, team) {
  const load2 = /* @__PURE__ */ new Map();
  return tasks.map((task, i) => ({
    ...task,
    assigneeId: pickAssignee(team, task.phase, i)
  })).map((task) => {
    if (!task.assigneeId) return task;
    const current = load2.get(task.assigneeId) ?? 0;
    load2.set(task.assigneeId, current + task.estimatedHours);
    return task;
  });
}

// prerector/web/backend/src/syncEngine.ts
var DEFAULT_VIDEO_FILES = [
  { name: "timeline.xml", size: 128e3, priority: "timeline", isProxy: false },
  { name: "project.prproj", size: 256e3, priority: "timeline", isProxy: false },
  { name: "footage_a001_proxy.mp4", size: 45e6, priority: "proxy", isProxy: true },
  { name: "footage_a002_proxy.mp4", size: 38e6, priority: "proxy", isProxy: true },
  { name: "footage_a001_raw.mov", size: 24e8, priority: "raw", isProxy: false },
  { name: "footage_a002_raw.mov", size: 18e8, priority: "raw", isProxy: false },
  { name: "color_lut.cube", size: 12e3, priority: "timeline", isProxy: false },
  { name: "subtitles.srt", size: 4e3, priority: "timeline", isProxy: false }
];
function priorityOrder(strategy) {
  switch (strategy) {
    case "timeline_first":
      return ["timeline", "proxy", "raw"];
    case "full":
      return ["timeline", "proxy", "raw"];
    case "proxy_first":
    default:
      return ["proxy", "timeline", "raw"];
  }
}
function guessMime(name) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "mp4") return "video/mp4";
  if (ext === "mov") return "video/quicktime";
  if (ext === "mkv") return "video/x-matroska";
  if (ext === "xml" || ext === "prproj") return "application/xml";
  if (ext === "srt") return "text/plain";
  if (ext === "cube") return "text/plain";
  return "application/octet-stream";
}
function guessPriority(name, isProxy) {
  if (isProxy || name.includes("proxy")) return "proxy";
  if (/timeline|\.xml|\.prproj|\.srt|\.cube|edit/i.test(name)) return "timeline";
  if (/raw|\.mov|\.mp4|footage|a00/i.test(name)) return "raw";
  return "timeline";
}
function createSyncSession(input) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const strategy = input.strategy ?? "proxy_first";
  const sessionId = v4_default();
  const specs = input.fileNames && input.fileNames.length > 0 ? input.fileNames.map((name) => {
    const isProxy = name.includes("proxy");
    return {
      name,
      size: isProxy ? 4e7 : name.includes("raw") ? 15e8 : 2e5,
      priority: guessPriority(name, isProxy),
      isProxy
    };
  }) : DEFAULT_VIDEO_FILES;
  const order = priorityOrder(strategy);
  const sorted = [...specs].sort(
    (a, b) => order.indexOf(a.priority) - order.indexOf(b.priority)
  );
  const files = sorted.map((spec) => ({
    id: v4_default(),
    sessionId,
    name: spec.name,
    sizeBytes: spec.size,
    priority: spec.priority,
    status: "pending",
    progress: 0,
    isProxy: spec.isProxy,
    mimeType: guessMime(spec.name)
  }));
  return {
    id: sessionId,
    projectId: input.projectId,
    name: input.name,
    strategy,
    files,
    createdAt: now
  };
}
function advanceSyncSession(session) {
  const files = session.files.map((f) => ({ ...f }));
  const active = files.find((f) => f.status === "syncing");
  const next = active ?? files.find((f) => f.status === "pending" && (f.priority === "proxy" || f.priority === "timeline"));
  if (!next) return { ...session, files };
  const idx = files.findIndex((f) => f.id === next.id);
  const chunkRate = next.isProxy ? 18 : next.priority === "timeline" ? 35 : 4;
  const newProgress = Math.min(100, next.progress + chunkRate);
  files[idx] = {
    ...next,
    status: newProgress >= 100 ? "done" : "syncing",
    progress: newProgress
  };
  return { ...session, files };
}
function syncStats(session) {
  const total = session.files.length;
  const done = session.files.filter((f) => f.status === "done").length;
  const bytesTotal = session.files.reduce((s, f) => s + f.sizeBytes, 0);
  const bytesDone = session.files.reduce(
    (s, f) => s + f.sizeBytes * f.progress / 100,
    0
  );
  return { total, done, bytesTotal, bytesDone, percent: total ? done / total * 100 : 0 };
}

// prerector/web/backend/src/store.ts
var DATA_DIR4 = process.env.VERCEL ? path7.join("/tmp", "everec-prerector") : path7.join(process.cwd(), "data", "prerector");
var STORE_FILE = path7.join(DATA_DIR4, "store.json");
function migrateStore(data) {
  return {
    users: data.users ?? [],
    friendRequests: data.friendRequests ?? [],
    chatMessages: data.chatMessages ?? [],
    chatReadAt: data.chatReadAt ?? {},
    projects: (data.projects ?? []).map((p) => ({
      ...p,
      projectType: p.projectType ?? "video",
      scope: p.scope ?? p.videoDurationMin ?? 5,
      scopeUnit: p.scopeUnit ?? "min"
    })),
    tasks: data.tasks ?? [],
    teams: data.teams ?? [],
    syncSessions: data.syncSessions ?? [],
    reminders: data.reminders ?? []
  };
}
function load() {
  try {
    if (fs7.existsSync(STORE_FILE)) {
      const data = migrateStore(JSON.parse(fs7.readFileSync(STORE_FILE, "utf-8")));
      if (data.users.length === 0) return seedDemo();
      return data;
    }
  } catch {
  }
  return seedDemo();
}
function save(data) {
  fs7.mkdirSync(DATA_DIR4, { recursive: true });
  fs7.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
}
function seedDemo() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const users = [
    { id: "user-me", name: "\u4F60", handle: "me", avatarColor: "#7c6cff", bio: "Prerector \u534F\u4F5C\u8005", createdAt: now },
    { id: v4_default(), name: "\u5F20\u660E", handle: "zhangming", avatarColor: "#ff6b2c", bio: "\u5BFC\u6F14 / \u5236\u7247", createdAt: now },
    { id: v4_default(), name: "\u674E\u60A6", handle: "liyue", avatarColor: "#4da3ff", bio: "\u526A\u8F91\u5E08", createdAt: now },
    { id: v4_default(), name: "\u738B\u6D69", handle: "wanghao", avatarColor: "#a78bfa", bio: "\u8C03\u8272\u5E08", createdAt: now },
    { id: v4_default(), name: "\u9648\u97F3", handle: "chenyin", avatarColor: "#3dd68c", bio: "\u58F0\u97F3\u8BBE\u8BA1", createdAt: now },
    { id: v4_default(), name: "\u5218\u7545", handle: "liuchang", avatarColor: "#ff9f43", bio: "CS \u5927\u4E09 \xB7 \u5C0F\u7EC4\u4F5C\u4E1A\u5E38\u5BA2", createdAt: now }
  ];
  const [me, zhang, li, wang, chen, liu] = users;
  const productionTeam = {
    id: v4_default(),
    name: "\u54C1\u724C\u77ED\u7247\u7EC4",
    kind: "production",
    createdAt: now,
    members: [
      { id: v4_default(), name: zhang.name, role: "director", color: zhang.avatarColor, userId: zhang.id },
      { id: v4_default(), name: li.name, role: "editor", color: li.avatarColor, userId: li.id },
      { id: v4_default(), name: wang.name, role: "colorist", color: wang.avatarColor, userId: wang.id },
      { id: v4_default(), name: chen.name, role: "sound", color: chen.avatarColor, userId: chen.id }
    ]
  };
  const homeworkTeam = {
    id: v4_default(),
    name: "\u7B2C 5 \u7EC4 \xB7 \u6570\u636E\u7ED3\u6784\u5927\u4F5C\u4E1A",
    kind: "homework",
    createdAt: now,
    members: [
      { id: v4_default(), name: me.name, role: "producer", color: me.avatarColor, userId: me.id },
      { id: v4_default(), name: liu.name, role: "other", color: liu.avatarColor, userId: liu.id },
      { id: v4_default(), name: li.name, role: "other", color: li.avatarColor, userId: li.id }
    ]
  };
  const videoProject = decomposeProject(
    { brief: "30 \u79D2\u54C1\u724C\u5BA3\u4F20\u7247 \xB7 A24 \u98CE\u683C \xB7 4K \u4EA4\u4ED8", projectType: "video", scope: 0.5, teamId: productionTeam.id },
    productionTeam
  );
  const homeworkProject = decomposeProject(
    { brief: "\u6570\u636E\u7ED3\u6784\u8BFE\u7A0B\u5927\u4F5C\u4E1A \xB7 \u5B9E\u73B0\u7EA2\u9ED1\u6811\u53EF\u89C6\u5316 \xB7 \u5C0F\u7EC4\u63D0\u4EA4", projectType: "homework", scope: 10, teamId: homeworkTeam.id },
    homeworkTeam
  );
  const friendRequests = [
    { id: v4_default(), fromUserId: zhang.id, toUserId: me.id, status: "accepted", createdAt: now },
    { id: v4_default(), fromUserId: li.id, toUserId: me.id, status: "accepted", createdAt: now },
    { id: v4_default(), fromUserId: liu.id, toUserId: me.id, status: "accepted", createdAt: now },
    { id: v4_default(), fromUserId: wang.id, toUserId: me.id, status: "pending", message: "\u4E00\u8D77\u505A\u4E2A\u9879\u76EE\uFF1F", createdAt: now }
  ];
  const chatMessages = [
    { id: v4_default(), teamId: homeworkTeam.id, senderId: liu.id, senderName: liu.name, content: "\u5927\u5BB6\u4ECA\u665A 8 \u70B9\u817E\u8BAF\u4F1A\u8BAE\u5BF9\u4E00\u4E0B\u5206\u5DE5\uFF1F", createdAt: new Date(Date.now() - 36e5).toISOString() },
    { id: v4_default(), teamId: homeworkTeam.id, senderId: me.id, senderName: me.name, content: "\u597D\uFF0C\u6211\u8D1F\u8D23\u53EF\u89C6\u5316\u90E8\u5206", createdAt: new Date(Date.now() - 3e6).toISOString() },
    { id: v4_default(), teamId: homeworkTeam.id, senderId: li.id, senderName: li.name, content: "\u6211\u5199\u5B9E\u9A8C\u62A5\u544A\u7B2C 2\u30013 \u7AE0", createdAt: new Date(Date.now() - 24e5).toISOString() },
    { id: v4_default(), teamId: productionTeam.id, senderId: zhang.id, senderName: zhang.name, content: "\u7C97\u526A\u7248\u672C\u53D1\u7FA4\u4E86\uFF0C\u5927\u5BB6\u770B\u4E00\u4E0B\u8282\u594F", createdAt: new Date(Date.now() - 72e5).toISOString() }
  ];
  const sync = createSyncSession({ projectId: videoProject.project.id, name: "\u4EE3\u7406\u4F18\u5148\u540C\u6B65", strategy: "proxy_first" });
  const reminders = [...videoProject.tasks.slice(0, 2), ...homeworkProject.tasks.slice(0, 1)].map((t) => ({
    id: v4_default(),
    projectId: t.projectId,
    taskId: t.id,
    title: `\u622A\u6B62\u63D0\u9192 \xB7 ${t.title}`,
    message: `\u4EFB\u52A1\u300C${t.title}\u300D\u5373\u5C06\u5230\u671F\uFF0C\u9884\u8BA1 ${t.estimatedHours}h`,
    dueAt: t.dueAt ?? new Date(Date.now() + 864e5).toISOString(),
    notified: false,
    createdAt: now
  }));
  const data = {
    users,
    friendRequests,
    chatMessages,
    chatReadAt: {},
    projects: [videoProject.project, homeworkProject.project],
    tasks: [...videoProject.tasks, ...homeworkProject.tasks],
    teams: [productionTeam, homeworkTeam],
    syncSessions: [sync],
    reminders
  };
  save(data);
  return data;
}
var cache = load();
function persist() {
  save(cache);
}
function resolveUserId(header) {
  if (header && cache.users.some((u) => u.id === header)) return header;
  return cache.users[0]?.id ?? "user-me";
}
function getUser(id) {
  return cache.users.find((u) => u.id === id);
}
function getTeam(id) {
  if (!id) return void 0;
  return cache.teams.find((t) => t.id === id);
}
function areFriends(a, b) {
  return cache.friendRequests.some(
    (r) => r.status === "accepted" && (r.fromUserId === a && r.toUserId === b || r.fromUserId === b && r.toUserId === a)
  );
}
function hasPendingRequest(a, b) {
  return cache.friendRequests.some(
    (r) => r.status === "pending" && (r.fromUserId === a && r.toUserId === b || r.fromUserId === b && r.toUserId === a)
  );
}
function getMe(userId) {
  const user = getUser(userId);
  if (!user) throw new Error("user not found");
  return user;
}
function searchUsers(query, userId) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return cache.users.filter(
    (u) => u.id !== userId && !areFriends(userId, u.id) && (u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q))
  );
}
function listFriends(userId) {
  return cache.friendRequests.filter(
    (r) => r.status === "accepted" && (r.fromUserId === userId || r.toUserId === userId)
  ).map((r) => {
    const friendId = r.fromUserId === userId ? r.toUserId : r.fromUserId;
    return getUser(friendId);
  }).filter(Boolean);
}
function listFriendRequests(userId) {
  return cache.friendRequests.filter((r) => r.status === "pending" && r.toUserId === userId).map((r) => ({
    ...r,
    fromUser: getUser(r.fromUserId)
  })).filter((r) => r.fromUser);
}
function sendFriendRequest(fromUserId, target) {
  const toUser = (target.userId ? getUser(target.userId) : void 0) ?? cache.users.find((u) => u.handle === target.handle?.replace(/^@/, ""));
  if (!toUser) throw new Error("\u7528\u6237\u4E0D\u5B58\u5728");
  if (toUser.id === fromUserId) throw new Error("\u4E0D\u80FD\u6DFB\u52A0\u81EA\u5DF1\u4E3A\u597D\u53CB");
  if (areFriends(fromUserId, toUser.id)) throw new Error("\u5DF2\u7ECF\u662F\u597D\u53CB");
  if (hasPendingRequest(fromUserId, toUser.id)) throw new Error("\u5DF2\u53D1\u9001\u597D\u53CB\u8BF7\u6C42");
  const req = {
    id: v4_default(),
    fromUserId,
    toUserId: toUser.id,
    status: "pending",
    message: target.message,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  cache.friendRequests.push(req);
  persist();
  return req;
}
function acceptFriendRequest(requestId, userId) {
  const idx = cache.friendRequests.findIndex((r) => r.id === requestId);
  if (idx < 0) throw new Error("\u8BF7\u6C42\u4E0D\u5B58\u5728");
  const req = cache.friendRequests[idx];
  if (req.toUserId !== userId) throw new Error("\u65E0\u6743\u64CD\u4F5C");
  cache.friendRequests[idx] = { ...req, status: "accepted" };
  persist();
  return cache.friendRequests[idx];
}
function rejectFriendRequest(requestId, userId) {
  const idx = cache.friendRequests.findIndex((r) => r.id === requestId);
  if (idx < 0) throw new Error("\u8BF7\u6C42\u4E0D\u5B58\u5728");
  const req = cache.friendRequests[idx];
  if (req.toUserId !== userId) throw new Error("\u65E0\u6743\u64CD\u4F5C");
  cache.friendRequests[idx] = { ...req, status: "rejected" };
  persist();
  return cache.friendRequests[idx];
}
function listChatMessages(teamId, userId) {
  const team = getTeam(teamId);
  if (!team) throw new Error("\u5C0F\u7EC4\u4E0D\u5B58\u5728");
  const isMember = team.members.some((m) => m.userId === userId);
  if (!isMember) throw new Error("\u4F60\u4E0D\u662F\u8BE5\u5C0F\u7EC4\u6210\u5458");
  return cache.chatMessages.filter((m) => m.teamId === teamId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
function sendChatMessage(teamId, userId, content) {
  const team = getTeam(teamId);
  if (!team) throw new Error("\u5C0F\u7EC4\u4E0D\u5B58\u5728");
  const member = team.members.find((m) => m.userId === userId);
  if (!member) throw new Error("\u4F60\u4E0D\u662F\u8BE5\u5C0F\u7EC4\u6210\u5458");
  if (!content.trim()) throw new Error("\u6D88\u606F\u4E0D\u80FD\u4E3A\u7A7A");
  const msg = {
    id: v4_default(),
    teamId,
    senderId: userId,
    senderName: member.name,
    content: content.trim(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  cache.chatMessages.push(msg);
  persist();
  return msg;
}
function markChatRead(teamId, userId) {
  if (!cache.chatReadAt[userId]) cache.chatReadAt[userId] = {};
  cache.chatReadAt[userId][teamId] = (/* @__PURE__ */ new Date()).toISOString();
  persist();
  return { ok: true };
}
function countUnread(userId) {
  let count = 0;
  for (const team of cache.teams) {
    if (!team.members.some((m) => m.userId === userId)) continue;
    const lastRead = cache.chatReadAt[userId]?.[team.id];
    const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;
    count += cache.chatMessages.filter(
      (m) => m.teamId === team.id && m.senderId !== userId && new Date(m.createdAt).getTime() > lastReadTime
    ).length;
  }
  return count;
}
function getDashboard(userId) {
  const now = Date.now();
  const week = now + 7 * 864e5;
  return {
    totalTasks: cache.tasks.length,
    doneTasks: cache.tasks.filter((t) => t.status === "done").length,
    inProgressTasks: cache.tasks.filter((t) => t.status === "in_progress").length,
    totalEstimatedHours: cache.tasks.reduce((s, t) => s + t.estimatedHours, 0),
    upcomingReminders: cache.reminders.filter((r) => !r.notified && new Date(r.dueAt).getTime() <= week).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).slice(0, 5),
    activeSyncSessions: cache.syncSessions.filter((s) => s.files.some((f) => f.status !== "done")).length,
    friendCount: listFriends(userId).length,
    pendingFriendRequests: cache.friendRequests.filter((r) => r.status === "pending" && r.toUserId === userId).length,
    unreadChatCount: countUnread(userId)
  };
}
function listProjects2() {
  return cache.projects;
}
function listTasks(projectId) {
  return projectId ? cache.tasks.filter((t) => t.projectId === projectId) : cache.tasks;
}
function updateTaskStatus(id, status) {
  const idx = cache.tasks.findIndex((t) => t.id === id);
  if (idx < 0) throw new Error("task not found");
  cache.tasks[idx] = { ...cache.tasks[idx], status };
  persist();
  return cache.tasks[idx];
}
function assignTask(id, assigneeId) {
  const idx = cache.tasks.findIndex((t) => t.id === id);
  if (idx < 0) throw new Error("task not found");
  cache.tasks[idx] = { ...cache.tasks[idx], assigneeId };
  persist();
  return cache.tasks[idx];
}
function decompose(req) {
  const team = getTeam(req.teamId);
  const result = decomposeProject(req, team);
  cache.projects.push(result.project);
  cache.tasks.push(...result.tasks);
  for (const t of result.tasks.slice(0, 2)) {
    cache.reminders.push({
      id: v4_default(),
      projectId: result.project.id,
      taskId: t.id,
      title: `\u65B0\u4EFB\u52A1 \xB7 ${t.title}`,
      message: `\u96BE\u5EA6 ${t.difficulty}/5 \xB7 \u9884\u4F30 ${t.estimatedHours}h`,
      dueAt: t.dueAt ?? new Date(Date.now() + 864e5).toISOString(),
      notified: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  persist();
  return result;
}
function listTeams(userId) {
  if (!userId) return cache.teams;
  return cache.teams.filter((t) => t.members.some((m) => m.userId === userId));
}
function createTeam(input) {
  const kind = input.kind ?? "production";
  const memberMap = /* @__PURE__ */ new Map();
  for (const fid of input.friendUserIds ?? []) {
    const user = getUser(fid);
    if (!user) continue;
    memberMap.set(user.id, {
      id: v4_default(),
      name: user.name,
      role: "other",
      color: user.avatarColor,
      userId: user.id
    });
  }
  if (input.ownerUserId) {
    const owner = getUser(input.ownerUserId);
    if (owner && !memberMap.has(owner.id)) {
      memberMap.set(owner.id, {
        id: v4_default(),
        name: owner.name,
        role: "producer",
        color: owner.avatarColor,
        userId: owner.id
      });
    }
  }
  for (const m of input.members ?? []) {
    if (!m.name.trim()) continue;
    memberMap.set(m.name, { ...m, id: v4_default(), name: m.name.trim() });
  }
  const team = {
    id: v4_default(),
    name: input.name,
    kind,
    members: [...memberMap.values()],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  cache.teams.push(team);
  cache.chatMessages.push({
    id: v4_default(),
    teamId: team.id,
    senderId: "system",
    senderName: "\u7CFB\u7EDF",
    content: `\u5C0F\u7EC4\u300C${team.name}\u300D\u5DF2\u521B\u5EFA\uFF0C\u5F00\u59CB\u534F\u4F5C\u5427`,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  persist();
  return team;
}
function rebalanceTeamTasks(teamId) {
  const team = getTeam(teamId);
  if (!team) throw new Error("team not found");
  const projectIds = new Set(cache.projects.filter((p) => p.teamId === teamId).map((p) => p.id));
  const tasks = cache.tasks.filter((t) => projectIds.has(t.projectId));
  const rebalanced = rebalanceAssignments(tasks, team);
  cache.tasks = cache.tasks.map((t) => rebalanced.find((r) => r.id === t.id) ?? t);
  persist();
  return rebalanced;
}
function listSyncSessions(projectId) {
  return projectId ? cache.syncSessions.filter((s) => s.projectId === projectId) : cache.syncSessions;
}
function startSync(input) {
  const session = createSyncSession(input);
  cache.syncSessions.push(session);
  persist();
  return session;
}
function tickSync(sessionId) {
  const idx = cache.syncSessions.findIndex((s) => s.id === sessionId);
  if (idx < 0) throw new Error("session not found");
  cache.syncSessions[idx] = advanceSyncSession(cache.syncSessions[idx]);
  persist();
  return cache.syncSessions[idx];
}
function listReminders(projectId) {
  const list = projectId ? cache.reminders.filter((r) => r.projectId === projectId) : cache.reminders;
  return list.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}
function createReminder(input) {
  const reminder = {
    id: v4_default(),
    ...input,
    notified: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  cache.reminders.push(reminder);
  persist();
  return reminder;
}
function dismissReminder(id) {
  const idx = cache.reminders.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("reminder not found");
  cache.reminders[idx] = { ...cache.reminders[idx], notified: true };
  persist();
  return cache.reminders[idx];
}
function getDueReminders() {
  const now = Date.now();
  return cache.reminders.filter((r) => !r.notified && new Date(r.dueAt).getTime() <= now);
}

// prerector/web/backend/src/app.ts
var app3 = new Hono2().basePath("/api/prerector");
app3.use("*", cors());
app3.use("*", async (c, next) => {
  c.set("userId", resolveUserId(c.req.header("X-User-Id")));
  await next();
});
app3.onError((err, c) => {
  console.error("[prerector api]", err);
  return c.json({ error: err.message || "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF" }, 500);
});
app3.get(
  "/health",
  (c) => c.json({ ok: true, platform: "prerector", module: "collaboration" })
);
app3.get("/users/me", (c) => c.json(getMe(c.get("userId"))));
app3.get("/users/search", (c) => {
  const q = c.req.query("q") ?? "";
  return c.json(searchUsers(q, c.get("userId")));
});
app3.get("/friends", (c) => c.json(listFriends(c.get("userId"))));
app3.get("/friends/requests", (c) => c.json(listFriendRequests(c.get("userId"))));
app3.post("/friends/request", async (c) => {
  const body = await c.req.json();
  try {
    return c.json(sendFriendRequest(c.get("userId"), body));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});
app3.post("/friends/requests/:id/accept", (c) => {
  try {
    return c.json(acceptFriendRequest(c.req.param("id"), c.get("userId")));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});
app3.post("/friends/requests/:id/reject", (c) => {
  try {
    return c.json(rejectFriendRequest(c.req.param("id"), c.get("userId")));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});
app3.get("/chat/:teamId/messages", (c) => {
  try {
    return c.json(listChatMessages(c.req.param("teamId"), c.get("userId")));
  } catch (err) {
    return c.json({ error: String(err) }, 403);
  }
});
app3.post("/chat/:teamId/messages", async (c) => {
  const { content } = await c.req.json();
  try {
    return c.json(sendChatMessage(c.req.param("teamId"), c.get("userId"), content));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});
app3.post("/chat/:teamId/read", (c) => {
  markChatRead(c.req.param("teamId"), c.get("userId"));
  return c.json({ ok: true });
});
app3.get("/dashboard", (c) => c.json(getDashboard(c.get("userId"))));
app3.get("/projects", (c) => c.json(listProjects2()));
app3.get("/tasks", (c) => {
  const projectId = c.req.query("projectId");
  return c.json(listTasks(projectId));
});
app3.patch("/tasks/:id/status", async (c) => {
  const { status } = await c.req.json();
  return c.json(updateTaskStatus(c.req.param("id"), status));
});
app3.patch("/tasks/:id/assign", async (c) => {
  const { assigneeId } = await c.req.json();
  return c.json(assignTask(c.req.param("id"), assigneeId));
});
app3.post("/tasks/decompose", async (c) => {
  const body = await c.req.json();
  if (!body.brief?.trim() && !body.taskInput?.trim()) {
    return c.json({ error: "\u8BF7\u63D0\u4F9B\u9879\u76EE Brief \u6216\u4EFB\u52A1\u5217\u8868" }, 400);
  }
  return c.json(decompose({ ...body, brief: body.brief?.trim() || "\u81EA\u5B9A\u4E49\u9879\u76EE" }));
});
app3.post("/tasks/assess", async (c) => {
  const body = await c.req.json();
  if (!body.title?.trim()) {
    return c.json({ error: "\u8BF7\u63D0\u4F9B\u4EFB\u52A1\u6807\u9898" }, 400);
  }
  const projectType = detectProjectType(body.brief ?? body.title, body.projectType);
  const scope = body.scope ?? SCOPE_LABELS[projectType].default;
  const { difficulty, estimatedHours } = assessCustomTask(
    {
      title: body.title.trim(),
      description: body.description?.trim() || body.title.trim(),
      phase: "\u6267\u884C"
    },
    body.brief ?? "",
    projectType,
    scope
  );
  return c.json({
    difficulty,
    estimatedHours,
    difficultyLabel: DIFFICULTY_LABELS[difficulty]
  });
});
app3.get("/teams", (c) => c.json(listTeams(c.get("userId"))));
app3.post("/teams", async (c) => {
  const body = await c.req.json();
  if (!body.name?.trim()) return c.json({ error: "\u8BF7\u63D0\u4F9B\u5C0F\u7EC4\u540D\u79F0" }, 400);
  return c.json(
    createTeam({
      name: body.name,
      members: body.members,
      friendUserIds: body.friendUserIds,
      kind: body.kind,
      ownerUserId: c.get("userId")
    })
  );
});
app3.post("/teams/:id/rebalance", (c) => {
  try {
    return c.json(rebalanceTeamTasks(c.req.param("id")));
  } catch (err) {
    return c.json({ error: String(err) }, 404);
  }
});
app3.get("/sync", (c) => {
  const projectId = c.req.query("projectId");
  const sessions = listSyncSessions(projectId);
  return c.json(sessions.map((s) => ({ ...s, stats: syncStats(s) })));
});
app3.post("/sync", async (c) => {
  const body = await c.req.json();
  if (!body.projectId || !body.name) {
    return c.json({ error: "\u7F3A\u5C11 projectId \u6216 name" }, 400);
  }
  const session = startSync(body);
  return c.json({ ...session, stats: syncStats(session) });
});
app3.post("/sync/:id/tick", (c) => {
  try {
    const session = tickSync(c.req.param("id"));
    return c.json({ ...session, stats: syncStats(session) });
  } catch (err) {
    return c.json({ error: String(err) }, 404);
  }
});
app3.get("/reminders", (c) => {
  const projectId = c.req.query("projectId");
  return c.json(listReminders(projectId));
});
app3.get("/reminders/due", (c) => c.json(getDueReminders()));
app3.post("/reminders", async (c) => {
  const body = await c.req.json();
  if (!body.title || !body.dueAt) {
    return c.json({ error: "\u7F3A\u5C11 title \u6216 dueAt" }, 400);
  }
  return c.json(createReminder(body));
});
app3.post("/reminders/:id/dismiss", (c) => {
  try {
    return c.json(dismissReminder(c.req.param("id")));
  } catch (err) {
    return c.json({ error: String(err) }, 404);
  }
});
var app_default3 = app3;

// api/_entry.ts
var entry_default = {
  fetch(req, context) {
    const pathname = new URL(req.url).pathname;
    if (pathname.startsWith("/api/knowgo")) {
      return app_default2.fetch(req, context);
    }
    if (pathname.startsWith("/api/prerector")) {
      return app_default3.fetch(req, context);
    }
    return app_default.fetch(req, context);
  }
};
export {
  entry_default as default
};
