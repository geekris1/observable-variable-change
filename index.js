let variables = undefined;
const weakMap = new WeakMap();
const handlers = {
  get(target, key, receiver) {
    console.log(key, 'key');
    let value = Reflect.get(target, key, receiver);
    track(target, key, value);
    if (typeof value === 'object') return observable(value);
    return value;
  },
  set(target, key, value, receiver) {
    track(target, key, value);
    let depsMap = weakMap.get(variables.target);
    if (!depsMap) {
      weakMap.set(variables.target, { [variables.key]: value });
    } else {
      weakMap.set(variables.target, { ...depsMap, [variables.key]: value });
    }
    variables = undefined;
    return Reflect.set(target, key, value, receiver);
  },
};

function get(target) {
  return weakMap.get(target);
}

function track(target, key, value) {
  if (variables === undefined || variables.current !== target) {
    variables = {
      target: target,
      current: value,
      key: Array.isArray(target) ? `[${key}]` : key,
    };
  } else {
    variables.key += Array.isArray(target) ? `[${key}]` : `.${key}`;
    variables.current = value;
  }
}
function observable(target) {
  return new Proxy(target, handlers);
}

let obj = {
  a: { b: 100 },
  b: [1, 2, 3, 4],
  c: 100,
};
let proxy = observable(obj);
proxy.a.b = 100;
proxy.b[1] = 200;
console.log(proxy.a.b);
proxy.b[1] = 300;
proxy.c = 400;

app.innerHTML = JSON.stringify(get(obj));

console.log(get(obj));
