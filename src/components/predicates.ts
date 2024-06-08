import type {
  FormFieldDto,
  FieldConditionRuleOperator,
  FormDto,
  DtoWithCondition,
} from "./types";
import { getFieldById } from "./field-utils";
import {
  type MapFormFieldToZodFn,
  mapFieldToZod,
  coerceRuleValue,
} from "./umbraco-form-to-zod";

export function exhaustiveCheck(value: never): never {
  throw new Error("Exhaustive check failed for value: " + value);
}

/**
 * Determines whether an indicator should be shown for a form field.
 *
 * @param {FormFieldDto} field - The form field to check.
 * @param {FormDto} form - The form to which the field belongs.
 * @returns {boolean} - True if an indicator should be shown, false otherwise.
 */
export function shouldShowIndicator(
  field: FormFieldDto,
  form: FormDto,
): boolean {
  if (form.fieldIndicationType === "NoIndicator") {
    return false;
  }
  if (form.fieldIndicationType === "MarkMandatoryFields") {
    return !!field.required;
  }
  if (form.fieldIndicationType === "MarkOptionalFields") {
    return !field.required;
  }
  return false;
}

/**
 * Checks if the condition specified in the data transfer object is fulfilled based on the form data.
 *
 * @param {DtoWithCondition} dto - The data transfer object containing the condition to check.
 * @param {FormDto} form - The form which includes the form structure and values.
 * @param {Record<string, unknown>} data - The data record containing field values.
 * @param {MapFormFieldToZodFn} [mapCustomFieldToZodType] - Optional function to map custom fields to Zod types.
 * @returns {boolean} - Returns `true` if the condition is fulfilled, otherwise `false`.
 */
export function isConditionFulfilled(
  dto: DtoWithCondition,
  form: FormDto,
  data: Record<string, unknown>,
  mapCustomFieldToZodType?: MapFormFieldToZodFn,
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

/**
 * Checks if all the rules in a data transfer object's condition are fulfilled based on the provided form and data.
 *
 * @param {DtoWithCondition} dto - The data transfer object containing the condition to check.
 * @param {FormDto} form - The form which includes the fields to be checked against the rules.
 * @param {Record<string, unknown>} data - The data object containing field values to be validated.
 * @param {MapFormFieldToZodFn} [mapCustomFieldToZodType] - Optional function to map custom fields to Zod types.
 * @returns {boolean} - Returns true if all the rules are fulfilled, otherwise false.
 * @throws {TypeError} - Throws an error if a rule field is undefined.
 * @throws {Error} - Throws an error if a rule target field cannot be found in the form definition.
 */
export function areAllRulesFulfilled(
  dto: DtoWithCondition,
  form: FormDto,
  data: Record<string, unknown>,
  mapCustomFieldToZodType?: MapFormFieldToZodFn,
): boolean {
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
