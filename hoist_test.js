
var window = { location: { href: '' } };
var document = {
  getElementById: (id) => ({ classList: { add:()=>{}, remove:()=>{} }, value: '', style: {} }),
  querySelectorAll: () => []
};

// Global error
throw new Error('boom');

function switchTab() { console.log('I am defined!'); }
