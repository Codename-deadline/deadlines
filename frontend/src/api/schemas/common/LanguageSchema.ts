import z from "zod";
import { Language } from "@/types/Language";

export const LanguageSchema = z.enum(Object.values(Language));
