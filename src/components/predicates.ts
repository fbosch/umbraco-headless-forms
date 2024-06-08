import type {
  FormFieldDto,
  FieldConditionRuleOperator,
  FormDto,
  DtoWithCondition,
} from "./types";
import { getFieldById } from "./field-utils";
import {
  type MapFormFieldToZod,
  mapFieldToZod,
  coerceRuleValue,
} from "./umbraco-form-to-zod";

export function exhaustiveCheck(value: never): never {
  throw new Error("Exhaustive check failed for value: " + value);
}

export function shouldShowIndicator(field: FormFieldDto, form: FormDto) {
  if (form.fieldIndicationType === "NoIndicator") {
    return false;
  }
  if (form.fieldIndicationType === "MarkMandatoryFields") {
    return field.required;
  }
  if (form.fieldIndicationType === "MarkOptionalFields") {
    return !field.required;
  }
}

/** get evaluated condition rules for a given page, fieldset or field */
export function isConditionFulfilled(
  dto: DtoWithCondition,
  form: FormDto,
  data: Record<string, unknown>,
  mapCustomFieldToZodType?: MapFormFieldToZod,
): boolean {
  const isFulfilled = areAllRulesFulfilled(
    dto,
    form,
    data,
    mapCustomFieldToZodType,
  );

  if (dto?.condition?.actionType === "Show") {
    return isFulfilled;
  }

  if (dto?.condition?.actionType === "Hide") {
    return !isFulfilled;
  }

  return true;
}

export function areAllRulesFulfilled(
  dto: DtoWithCondition,
  form: FormDto,
  data: Record<string, unknown>,
  mapCustomFieldToZodType?: MapFormFieldToZod,
) {
  const rules = dto?.condition?.rules;
  if (!rules || rules.length === 0) return true;

  const appliedRules = rules.map((rule): boolean => {
    if (rule?.field === undefined) {
      throw new TypeError("Rule field is undefined");
    }
    const operator = rule?.operator as FieldConditionRuleOperator;
    const targetField = getFieldById(form, rule.field);
    if (targetField === undefined || targetField.alias === undefined) {
      throw new Error(
        `Rule target for field id: "${rule.field}" could not be found in the form definition`,
      );
    }
    const fieldZodType = mapFieldToZod(targetField, mapCustomFieldToZodType);
    const fieldValue = data[targetField.alias];
    const ruleValue = coerceRuleValue(fieldZodType, rule.value);

    switch (operator) {
      case "Is":
        return fieldValue === ruleValue;
      case "IsNot":
        return fieldValue !== ruleValue;
      case "GreaterThen":
        return fieldValue && ruleValue ? fieldValue > ruleValue : false;
      case "LessThen":
        return fieldValue && ruleValue ? fieldValue < ruleValue : false;
      case "Contains":
        return fieldValue && ruleValue
          ? fieldValue.toString().includes(ruleValue)
          : false;
      case "ContainsIgnoreCase":
        return fieldValue && ruleValue
          ? fieldValue
              .toString()
              .toLowerCase()
              .includes(ruleValue?.toLowerCase())
          : false;
      case "StartsWith":
        return fieldValue && ruleValue
          ? fieldValue.toString().startsWith(ruleValue)
          : false;
      case "StartsWithIgnoreCase":
        return fieldValue && ruleValue
          ? fieldValue
              .toString()
              .toLowerCase()
              .startsWith(ruleValue.toLowerCase())
          : false;
      case "EndsWith":
        return fieldValue && ruleValue
          ? fieldValue.toString().endsWith(ruleValue)
          : false;
      case "EndsWithIgnoreCase":
        return fieldValue && ruleValue
          ? fieldValue
              .toString()
              .toLowerCase()
              .endsWith(ruleValue.toLowerCase())
          : false;
      case "NotContains":
        return fieldValue && ruleValue
          ? !fieldValue.toString().includes(ruleValue)
          : false;
      case "NotContainsIgnoreCase":
        return fieldValue && ruleValue
          ? !fieldValue
              .toString()
              .toLowerCase()
              .includes(ruleValue?.toLowerCase())
          : false;
      case "NotStartsWith":
        return fieldValue && ruleValue
          ? !fieldValue.toString().startsWith(ruleValue)
          : false;
      case "NotStartsWithIgnoreCase":
        return fieldValue && ruleValue
          ? !fieldValue
              .toString()
              .toLowerCase()
              .startsWith(ruleValue.toLowerCase())
          : false;
      case "NotEndsWith":
        return fieldValue && ruleValue
          ? !fieldValue.toString().endsWith(ruleValue)
          : false;
      case "NotEndsWithIgnoreCase":
        return fieldValue && ruleValue
          ? !fieldValue
              .toString()
              .toLowerCase()
              .endsWith(ruleValue.toLowerCase())
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
