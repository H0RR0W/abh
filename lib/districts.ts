export const DISTRICTS = [
  "Гагрский",
  "Гудаутский",
  "Сухумский",
  "Гулрыпшский",
  "Очамчырский",
  "Ткуарчалский",
  "Галский",
] as const;

export type District = (typeof DISTRICTS)[number];

const CITY_TO_DISTRICT: Record<string, District> = {
  "г. Сухум": "Сухумский",
  "г. Гагра": "Гагрский",
  "г. Пицунда": "Гагрский",
  "г. Очамчыра": "Очамчырский",
  "г. Гудаута": "Гудаутский",
  "г. Ткуарчал": "Ткуарчалский",
  "г. Гал": "Галский",
  "г. Гулрыпш": "Гулрыпшский",
  "с. Агудзера": "Гулрыпшский",
  "с. Дранда": "Гулрыпшский",
};

export function addressToDistrict(address: string): District {
  const city = address.split(",")[0].trim();
  return CITY_TO_DISTRICT[city] ?? "Сухумский";
}
