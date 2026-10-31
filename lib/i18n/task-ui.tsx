"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./locale";

const LocaleContext = createContext<Locale>("fr");
export const LocaleProvider = LocaleContext.Provider;
export function useLocale() { return useContext(LocaleContext); }

export const taskUiTranslations = {
  fr: {
    boardTitle: "Gestionnaire de tâches", stats: "{total} tâches · {done} terminées · {progress} en cours · {todo} à faire", newTask: "Nouvelle tâche", search: "Rechercher…", all: "Toutes", sortDue: "Trier par échéance la plus proche en haut", tags: "Tags", clear: "Effacer", reorder: "Glisser pour réordonner", none: "Aucune tâche", title: "Titre", example: "Ex. Préparer la démo", description: "Description", optional: "Optionnel", priority: "Priorité", due: "Échéance", cancel: "Annuler", addTask: "Ajouter la tâche", noTitle: "Sans titre", missing: "Cette tâche est introuvable.", backBoard: "Retour au tableau", summary: "Résumé court…", notes: "Notes", openPage: "Ouvrir en pleine page", deleteTask: "Supprimer la tâche", close: "Fermer", delete: "Supprimer", tag: "Étiquette", manage: "Gérer", manageTags: "Gérer les étiquettes", reorderTags: "Réordonner", noTags: "Aucune étiquette pour le moment.", newTag: "Nouvelle étiquette", removeTag: "Supprimer l'étiquette", editTag: "Modifier l'étiquette", tagConfirm: "sera retirée de toutes les tâches. Cette action est irréversible.", findOrCreate: "Rechercher ou créer…", create: "Créer", noTag: "Aucune étiquette. Tapez pour en créer une.", remove: "Retirer", color: "Couleur", status: "Statut", clickHelp: "Clic : aperçu · Double-clic : ouvrir la fiche", noDue: "Pas d'échéance", changeStatus: "Changer le statut", notesPlaceholder: "Écrire des notes… (Markdown supporté)", bold: "Gras", italic: "Italique", underline: "Souligné", strike: "Barré", code: "Code", heading: "Titre", bulletList: "Liste à puces", link: "Lien", linkUrl: "Lien (URL)", deleteLabel: "Supprimer", statBoard: "Tableau", tagColor: "Couleur {color}",
  },
  es: {
    boardTitle: "Gestor de tareas", stats: "{total} tareas · {done} terminadas · {progress} en progreso · {todo} por hacer", newTask: "Nueva tarea", search: "Buscar…", all: "Todas", sortDue: "Ordenar por fecha límite más próxima", tags: "Etiquetas", clear: "Limpiar", reorder: "Arrastra para reordenar", none: "Ninguna tarea", title: "Título", example: "Ej. Preparar la demo", description: "Descripción", optional: "Opcional", priority: "Prioridad", due: "Fecha límite", cancel: "Cancelar", addTask: "Añadir tarea", noTitle: "Sin título", missing: "No se encuentra esta tarea.", backBoard: "Volver al tablero", summary: "Resumen breve…", notes: "Notas", openPage: "Abrir en página completa", deleteTask: "Eliminar tarea", close: "Cerrar", delete: "Eliminar", tag: "Etiqueta", manage: "Gestionar", manageTags: "Gestionar etiquetas", reorderTags: "Reordenar", noTags: "Todavía no hay etiquetas.", newTag: "Nueva etiqueta", removeTag: "Eliminar etiqueta", editTag: "Editar etiqueta", tagConfirm: "se quitará de todas las tareas. Esta acción es irreversible.", findOrCreate: "Buscar o crear…", create: "Crear", noTag: "No hay etiquetas. Escribe para crear una.", remove: "Quitar", color: "Color", status: "Estado", clickHelp: "Clic: vista previa · Doble clic: abrir ficha", noDue: "Sin fecha límite", changeStatus: "Cambiar estado", notesPlaceholder: "Escribe notas… (Markdown compatible)", bold: "Negrita", italic: "Cursiva", underline: "Subrayado", strike: "Tachado", code: "Código", heading: "Título", bulletList: "Lista con viñetas", link: "Enlace", linkUrl: "Enlace (URL)", deleteLabel: "Eliminar", statBoard: "Tablero", tagColor: "Color {color}",
  },
} as const;

export type TaskUiKey = keyof typeof taskUiTranslations.fr;
export function taskUi(locale: Locale, key: TaskUiKey, values: Record<string, string | number> = {}): string {
  return taskUiTranslations[locale][key].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ""));
}
