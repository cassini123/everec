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
var splitPath = (path2) => {
  const paths = path2.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path: path2 } = extractGroupsFromPath(routePath);
  const paths = splitPath(path2);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path2) => {
  const groups = [];
  path2 = path2.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path: path2 };
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
      const path2 = url.slice(start, end);
      return tryDecodeURI(path2.includes("%25") ? path2.replace(/%25/g, "%2525") : path2);
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
var checkOptionalParameter = (path2) => {
  if (path2.charCodeAt(path2.length - 1) !== 63 || !path2.includes(":")) {
    return null;
  }
  const segments = path2.split("/");
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
  constructor(request, path2 = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path2;
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
    this.on = (method, path2, ...handlers) => {
      for (const p of [path2].flat()) {
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
  route(path2, app2) {
    const subApp = this.basePath(path2);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
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
  basePath(path2) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path2);
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
  mount(path2, applicationHandler, options) {
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
      const mergedPath = mergePath(this._basePath, path2);
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
    this.#addRoute(METHOD_NAME_ALL, mergePath(path2, "*"), handler);
    return this;
  }
  #addRoute(method, path2, handler, baseRoutePath) {
    method = method.toUpperCase();
    path2 = mergePath(this._basePath, path2);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path: path2,
      method,
      handler
    };
    this.router.add(method, path2, [handler, r]);
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
    const path2 = this.getPath(request, { env });
    const matchResult = this.router.match(method, path2);
    const c = new Context(request, {
      path: path2,
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
function match(method, path2) {
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
  return match2(method, path2);
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
  insert(path2, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path2 = path2.replace(/\{[^}]+\}/g, (m) => {
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
    const tokens = path2.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
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
function buildWildcardRegExp(path2) {
  return wildcardRegExpCache[path2] ??= new RegExp(
    path2 === "*" ? "" : `^${path2.replace(
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
    const [pathErrorCheckOnly, path2, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path2] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path2, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path2) : e;
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
function findMiddleware(middleware, path2) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path2)) {
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
  add(method, path2, handler) {
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
    if (path2 === "/*") {
      path2 = "*";
    }
    const paramCount = (path2.match(/\/:/g) || []).length;
    if (/\*$/.test(path2)) {
      const re = buildWildcardRegExp(path2);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path2] ||= findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || [];
        });
      } else {
        middleware[method][path2] ||= findMiddleware(middleware[method], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || [];
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
    const paths = checkOptionalParameter(path2) || [path2];
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
      const ownRoute = r[method] ? Object.keys(r[method]).map((path2) => [path2, r[method][path2]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path2) => [path2, r[METHOD_NAME_ALL][path2]])
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
  add(method, path2, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path2, handler]);
  }
  match(method, path2) {
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
        res = router.match(method, path2);
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
  insert(method, path2, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path2);
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
  search(method, path2) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path2);
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
              let offset = path2[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path2.substring(partOffsets[i]);
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
  add(method, path2, handler) {
    const results = checkOptionalParameter(path2);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path2, handler);
  }
  match(method, path2) {
    return this.#node.search(method, path2);
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

// prerector/web/backend/src/store.ts
import fs from "node:fs";
import path from "node:path";

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
var DATA_DIR = process.env.VERCEL ? path.join("/tmp", "everec-prerector") : path.join(process.cwd(), "data", "prerector");
var STORE_FILE = path.join(DATA_DIR, "store.json");
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
    if (fs.existsSync(STORE_FILE)) {
      const data = migrateStore(JSON.parse(fs.readFileSync(STORE_FILE, "utf-8")));
      if (data.users.length === 0) return seedDemo();
      return data;
    }
  } catch {
  }
  return seedDemo();
}
function save(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
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
function listProjects() {
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
var app = new Hono2().basePath("/api");
app.use("*", cors());
app.use("*", async (c, next) => {
  c.set("userId", resolveUserId(c.req.header("X-User-Id")));
  await next();
});
app.onError((err, c) => {
  console.error("[prerector api]", err);
  return c.json({ error: err.message || "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF" }, 500);
});
app.get(
  "/health",
  (c) => c.json({ ok: true, platform: "prerector", module: "collaboration" })
);
app.get("/users/me", (c) => c.json(getMe(c.get("userId"))));
app.get("/users/search", (c) => {
  const q = c.req.query("q") ?? "";
  return c.json(searchUsers(q, c.get("userId")));
});
app.get("/friends", (c) => c.json(listFriends(c.get("userId"))));
app.get("/friends/requests", (c) => c.json(listFriendRequests(c.get("userId"))));
app.post("/friends/request", async (c) => {
  const body = await c.req.json();
  try {
    return c.json(sendFriendRequest(c.get("userId"), body));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});
app.post("/friends/requests/:id/accept", (c) => {
  try {
    return c.json(acceptFriendRequest(c.req.param("id"), c.get("userId")));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});
app.post("/friends/requests/:id/reject", (c) => {
  try {
    return c.json(rejectFriendRequest(c.req.param("id"), c.get("userId")));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});
app.get("/chat/:teamId/messages", (c) => {
  try {
    return c.json(listChatMessages(c.req.param("teamId"), c.get("userId")));
  } catch (err) {
    return c.json({ error: String(err) }, 403);
  }
});
app.post("/chat/:teamId/messages", async (c) => {
  const { content } = await c.req.json();
  try {
    return c.json(sendChatMessage(c.req.param("teamId"), c.get("userId"), content));
  } catch (err) {
    return c.json({ error: String(err) }, 400);
  }
});
app.post("/chat/:teamId/read", (c) => {
  markChatRead(c.req.param("teamId"), c.get("userId"));
  return c.json({ ok: true });
});
app.get("/dashboard", (c) => c.json(getDashboard(c.get("userId"))));
app.get("/projects", (c) => c.json(listProjects()));
app.get("/tasks", (c) => {
  const projectId = c.req.query("projectId");
  return c.json(listTasks(projectId));
});
app.patch("/tasks/:id/status", async (c) => {
  const { status } = await c.req.json();
  return c.json(updateTaskStatus(c.req.param("id"), status));
});
app.patch("/tasks/:id/assign", async (c) => {
  const { assigneeId } = await c.req.json();
  return c.json(assignTask(c.req.param("id"), assigneeId));
});
app.post("/tasks/decompose", async (c) => {
  const body = await c.req.json();
  if (!body.brief?.trim() && !body.taskInput?.trim()) {
    return c.json({ error: "\u8BF7\u63D0\u4F9B\u9879\u76EE Brief \u6216\u4EFB\u52A1\u5217\u8868" }, 400);
  }
  return c.json(decompose({ ...body, brief: body.brief?.trim() || "\u81EA\u5B9A\u4E49\u9879\u76EE" }));
});
app.post("/tasks/assess", async (c) => {
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
app.get("/teams", (c) => c.json(listTeams(c.get("userId"))));
app.post("/teams", async (c) => {
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
app.post("/teams/:id/rebalance", (c) => {
  try {
    return c.json(rebalanceTeamTasks(c.req.param("id")));
  } catch (err) {
    return c.json({ error: String(err) }, 404);
  }
});
app.get("/sync", (c) => {
  const projectId = c.req.query("projectId");
  const sessions = listSyncSessions(projectId);
  return c.json(sessions.map((s) => ({ ...s, stats: syncStats(s) })));
});
app.post("/sync", async (c) => {
  const body = await c.req.json();
  if (!body.projectId || !body.name) {
    return c.json({ error: "\u7F3A\u5C11 projectId \u6216 name" }, 400);
  }
  const session = startSync(body);
  return c.json({ ...session, stats: syncStats(session) });
});
app.post("/sync/:id/tick", (c) => {
  try {
    const session = tickSync(c.req.param("id"));
    return c.json({ ...session, stats: syncStats(session) });
  } catch (err) {
    return c.json({ error: String(err) }, 404);
  }
});
app.get("/reminders", (c) => {
  const projectId = c.req.query("projectId");
  return c.json(listReminders(projectId));
});
app.get("/reminders/due", (c) => c.json(getDueReminders()));
app.post("/reminders", async (c) => {
  const body = await c.req.json();
  if (!body.title || !body.dueAt) {
    return c.json({ error: "\u7F3A\u5C11 title \u6216 dueAt" }, 400);
  }
  return c.json(createReminder(body));
});
app.post("/reminders/:id/dismiss", (c) => {
  try {
    return c.json(dismissReminder(c.req.param("id")));
  } catch (err) {
    return c.json({ error: String(err) }, 404);
  }
});
var app_default = app;

// prerector/api/_entry.ts
var entry_default = {
  fetch(request, context) {
    return app_default.fetch(request, context);
  }
};
export {
  entry_default as default
};
