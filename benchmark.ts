const allowedKeysArray = ["name", "email", "phone", "dob", "gender", "address", "emergency_contact_name", "emergency_contact_phone", "primary_goal", "secondary_goal", "fitness_level", "diet_preference", "training_experience", "notes"];
const allowedKeysSet = new Set(allowedKeysArray);

const mockFormData = new Map();
// Add valid keys
allowedKeysArray.forEach(k => mockFormData.set(k, "value"));
// Add some invalid keys
for (let i = 0; i < 10; i++) {
  mockFormData.set(`invalid_key_${i}`, "value");
}

function runArrayBenchmark() {
  const updates: Record<string, string | null> = {};
  mockFormData.forEach((value, key) => {
    if (allowedKeysArray.includes(key)) {
      updates[key] = value ? (value as string) : null;
    }
  });
  return updates;
}

function runSetBenchmark() {
  const updates: Record<string, string | null> = {};
  mockFormData.forEach((value, key) => {
    if (allowedKeysSet.has(key)) {
      updates[key] = value ? (value as string) : null;
    }
  });
  return updates;
}

const ITERATIONS = 1000000;

console.log("Warming up...");
for (let i = 0; i < 10000; i++) {
  runArrayBenchmark();
  runSetBenchmark();
}

console.log("Running array benchmark...");
const startArray = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  runArrayBenchmark();
}
const endArray = performance.now();
const timeArray = endArray - startArray;

console.log("Running set benchmark...");
const startSet = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  runSetBenchmark();
}
const endSet = performance.now();
const timeSet = endSet - startSet;

console.log(`Array includes (O(N)): ${timeArray.toFixed(2)} ms`);
console.log(`Set has (O(1)): ${timeSet.toFixed(2)} ms`);
console.log(`Improvement: ${((timeArray - timeSet) / timeArray * 100).toFixed(2)}% faster`);
