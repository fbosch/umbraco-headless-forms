import type {
  FieldConditionRuleOperator,
  FormDto,
  FormFieldDto,
  DtoWithCondition,
} from "./types";
import { getFieldById } from "./utils";
import { mapFieldToZod } from "./umbraco-form-to-zod";

export function areConditionsMet(
  dto: DtoWithCondition,
  form: FormDto,
  formData: FormData | undefined,
) {
  const rules = dto?.condition?.rules;
  if (!rules || rules.length === 0) return true;

  function exhaustiveCheck(value: never): never {
    throw new Error(
      "Exhaustive check failed for field condition rule: " + value,
    );
  }

  const appliedRules = rules.map((rule): boolean => {
    const operator = rule.operator as FieldConditionRuleOperator;
    const targetField = getFieldById(form, rule.field);
    const zodType = mapFieldToZod(targetField);

    const alias = targetField?.alias as string;
    const fieldValue = formData?.get(alias);

    switch (operator) {
      case "Is":
        return fieldValue === rule.value;
      case "IsNot":
        return fieldValue !== rule.value;
      case "GreaterThen":
        return fieldValue && rule.value ? fieldValue > rule.value : false;
      case "LessThen":
        return fieldValue && rule.value ? fieldValue < rule.value : false;
      case "Contains":
        return fieldValue && rule.value
          ? fieldValue.toString().includes(rule.value)
          : false;
      case "ContainsIgnoreCase":
        return fieldValue && rule.value
          ? fieldValue
              .toString()
              .toLowerCase()
              .includes(rule.value.toLowerCase())
          : false;
      case "StartsWith":
        return fieldValue && rule.value
          ? fieldValue.toString().startsWith(rule.value)
          : false;
      case "StartsWithIgnoreCase":
        return fieldValue && rule.value
          ? fieldValue
              .toString()
              .toLowerCase()
              .startsWith(rule.value.toLowerCase())
          : false;
      case "EndsWith":
        return fieldValue && rule.value
          ? fieldValue.toString().endsWith(rule.value)
          : false;
      case "EndsWithIgnoreCase":
        return fieldValue && rule.value
          ? fieldValue
              .toString()
              .toLowerCase()
              .endsWith(rule.value.toLowerCase())
          : false;
      case "NotContains":
        return fieldValue && rule.value
          ? !fieldValue.toString().includes(rule.value)
          : false;
      case "NotContainsIgnoreCase":
        return fieldValue && rule.value
          ? !fieldValue
              .toString()
              .toLowerCase()
              .includes(rule.value.toLowerCase())
          : false;
      case "NotStartsWith":
        return fieldValue && rule.value
          ? !fieldValue.toString().startsWith(rule.value)
          : false;
      case "NotStartsWithIgnoreCase":
        return fieldValue && rule.value
          ? !fieldValue
              .toString()
              .toLowerCase()
              .startsWith(rule.value.toLowerCase())
          : false;
      case "NotEndsWith":
        return fieldValue && rule.value
          ? !fieldValue.toString().endsWith(rule.value)
          : false;
      case "NotEndsWithIgnoreCase":
        return fieldValue && rule.value
          ? !fieldValue
              .toString()
              .toLowerCase()
              .endsWith(rule.value.toLowerCase())
          : false;
      default:
        return exhaustiveCheck(operator);
    }
  });

  if (dto.condition?.logicType === "All") {
    return appliedRules.every((rule) => rule);
  }
  if (dto.condition?.logicType === "Any") {
    return appliedRules.some((rule) => rule);
  }

  return true;
}
