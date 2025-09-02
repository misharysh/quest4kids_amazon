import { DataSource } from 'typeorm';

// Возвращает имя enum-типа для колонки (например, 'task_status_enum')
export async function getEnumTypeName(
  ds: DataSource,
  tableName: string,
  columnName: string,
  schema = 'public',
): Promise<string | undefined> {
  const rows = await ds.query(
    `select c.udt_name as enum_name
     from information_schema.columns c
     where c.table_schema = $1 and c.table_name = $2 and c.column_name = $3
       and c.data_type = 'USER-DEFINED'`,
    [schema, tableName, columnName],
  );
  return rows[0]?.enum_name;
}

// Возвращает список допустимых значений enum-типа
export async function getEnumValues(ds: DataSource, enumName: string): Promise<string[]> {
  const rows = await ds.query(
    `select e.enumlabel as val
     from pg_type t
     join pg_enum e on e.enumtypid = t.oid
     where t.typname = $1
     order by e.enumsortorder`,
    [enumName],
  );
  return rows.map((r: any) => r.val);
}

// Подбирает значение enum для конкретной таблицы. Если переданы preferred — берём первое, которое реально есть в БД.
export async function pickEnumValue(
  ds: DataSource,
  tableName: string,
  columnName: string,
  preferred?: string[],
  schema = 'public',
): Promise<string | undefined> {
  const enumName = await getEnumTypeName(ds, tableName, columnName, schema);
  if (!enumName) return undefined;
  const values = await getEnumValues(ds, enumName);
  if (!values.length) return undefined;
  if (preferred?.length) {
    const found = preferred.find((p) => values.includes(p));
    if (found) return found;
  }
  return values[0]; // безопасный дефолт — первое значение enum
}
