import type {
  FormFieldDto,
  FieldConditionRuleOperator,
  FormDto,
  UmbracoFormConfig,
  DtoWithCondition,
} from "./types";
import { getFieldById, exhaustiveCheck } from "./utils";
import {
  coerceFormData,
  mapFieldToZod,
  coerceRuleValue,
} from "./umbraco-form-to-zod";

export function showIndicator(field: FormFieldDto, form: FormDto) {
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

export function validateConditionRules(
  dto: DtoWithCondition,
  form: FormDto,
  formData: FormData | undefined,
  config: UmbracoFormConfig,
) {
  const rules = dto?.condition?.rules;
  if (!rules || rules.length === 0) return true;

  const appliedRules = rules.map((rule): boolean => {
    const operator = rule.operator as FieldConditionRuleOperator;
    const targetField = getFieldById(form, rule.field);
    const zodType = mapFieldToZod(targetField, config.mapCustomFieldToZodType);
    const parsedFormData = coerceFormData(formData, config.schema);
    const alias = targetField?.alias as string;
    const fieldValue = parsedFormData[alias];
    const ruleValue = coerceRuleValue(zodType, rule.value);

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