const fs = require('fs');
const Ajv = require('ajv');
const schema = require('./llm-schema.json');

const ajv = new Ajv();
const validate = ajv.compile(schema);

// Example LLM outputs for validation
const exampleOutputs = [
  // Add example outputs here to validate against the schema
];

exampleOutputs.forEach((output, index) => {
  const valid = validate(output);
  if (!valid) {
    console.error(`Output ${index + 1} is invalid:`, validate.errors);
  } else {
    console.log(`Output ${index + 1} is valid.`);
  }
});