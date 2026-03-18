'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface SchemaFormProps {
  schema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
}

export function SchemaForm({ schema, value, onChange }: SchemaFormProps) {
  const properties = schema.properties || {};

  const handleChange = (key: string, fieldValue: any) => {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  };

  const renderField = (key: string, prop: any) => {
    const fieldValue = value[key] ?? '';
    const isRequired = schema.required?.includes(key);

    switch (prop.type) {
      case 'boolean':
        return (
          <div key={key} className="flex items-center justify-between space-x-2">
            <Label htmlFor={key} className="flex-1">
              {key} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Switch
              id={key}
              checked={!!fieldValue}
              onCheckedChange={(checked) => handleChange(key, checked)}
            />
          </div>
        );

      case 'integer':
      case 'number':
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>
              {key} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={key}
              type="number"
              value={fieldValue}
              onChange={(e) => handleChange(key, e.target.valueAsNumber)}
              placeholder={`请输入${key}`}
            />
          </div>
        );

      case 'object':
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>
              {key} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={key}
              value={
                typeof fieldValue === 'string' ? fieldValue : JSON.stringify(fieldValue, null, 2)
              }
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={`请输入 JSON 对象`}
              rows={4}
            />
          </div>
        );

      case 'string':
      default:
        if (prop.format === 'textarea' || (prop.description && prop.description.length > 50)) {
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>
                {key} {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id={key}
                value={fieldValue}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={`请输入${key}`}
                rows={3}
              />
            </div>
          );
        }
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>
              {key} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={key}
              type="text"
              value={fieldValue}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={`请输入${key}`}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(properties).map(([key, prop]) => renderField(key, prop))}
    </div>
  );
}
