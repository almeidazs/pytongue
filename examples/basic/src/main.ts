import { checkout } from './invoice.py';

const invoice = await checkout(
	[
		{ name: 'Coffee', price: 4.5, quantity: 2 },
		{ name: 'Bagel', price: 3 },
	],
	{ discount: 0.1 },
);

console.log(`Subtotal: $${invoice.subtotal}`);
console.log(`Total:    $${invoice.total}`);
