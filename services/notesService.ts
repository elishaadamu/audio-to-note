import { apiRequest } from "./apiClient";

export const notesService = {
  fetchNotes: async () => {
    return apiRequest("/notes");
  },

  fetchNote: async (id: string) => {
    return apiRequest(`/notes/${id}`);
  },

  saveNote: async (noteData: any, audioUri?: string) => {
    return apiRequest("/notes", {
      method: "POST",
      body: JSON.stringify({
        ...noteData,
        audioUrl: audioUri,
      }),
    });
  },

  generateNotes: async (audioUri: string) => {
    const formData = new FormData();
    // @ts-ignore
    formData.append("audio", {
      uri: audioUri,
      name: "lecture.m4a",
      type: "audio/m4a",
    });

    return apiRequest("/generate-notes", {
      method: "POST",
      body: formData,
    });
  },

  translateNote: async (noteId: string, targetLanguage: string) => {
    return apiRequest("/translate-note", {
      method: "POST",
      body: JSON.stringify({
        noteId,
        targetLanguage,
      }),
    });
  },

  deleteNote: async (id: string) => {
    return apiRequest(`/notes/${id}`, {
      method: "DELETE",
    });
  },

  clearAllNotes: async () => {
    return apiRequest("/notes", {
      method: "DELETE",
    });
  },

  resetNote: async (id: string) => {
    return apiRequest(`/notes/${id}/reset`, {
      method: "POST",
    });
  },
};
