export type EntityId = string;

export type ListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type ListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type FieldType = "text" | "textarea" | "email" | "number" | "date" | "select" | "checkbox";

export type FormFieldContract = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
};

export type CrudContract = {
  entityName: string;
  entityNamePlural: string;
  listPath: string;
  detailPath: string;
  createPath: string;
  fields: FormFieldContract[];
};
