import { defineDynamicNode, defineNode, NodeInterface, NumberInterface, SelectInterface } from "baklavajs";

export const NumberNode = defineNode({
	type: "NumberNode",
	outputs: {
		number: () => new NumberInterface("Number", 0),
	},
})

export const MathNode = defineDynamicNode({
	type: "DynamicMathNode",
	inputs: {
		operation: () => new SelectInterface("Operation", "Addition", ["Addition", "Subtraction", "Sine"]),
	},
	outputs: {
		result: () => new NodeInterface("Result", 0),
	},
	onUpdate({ operation }) {
		if (operation === "Sine") {
			return {
				inputs: {
					input1: () => new NumberInterface("Input", 0),
				},
			};
		} else {
			return {
				inputs: {
					input1: () => new NumberInterface("Input", 0),
					input2: () => new NumberInterface("Input", 0),
				},
			};
		}
	},
	calculate(inputs) {
		let result = 0;
		switch (inputs.operation) {
			case "Addition":
				result = inputs.input1 + inputs.input2;
				break;
			case "Subtraction":
				result = inputs.input1 - inputs.input2;
				break;
			case "Sine":
				result = Math.sin(inputs.input1);
				break;
		}
		return { result };
	},
});

export default [NumberNode, MathNode] as const;