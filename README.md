# ChaibookLM

ChaibookLM is based on Google's Notebook LLM.
It takes sources like textual data, PDFs, VTT file, Youtube links and Web links and 
answers based on these sources.

This project is React based web-application. The AI model used is Gemini via OpenAI.
You can pass OpenAI's API key in the env.
For running the project:
```bash
npm run dev
```

Then open http://localhost:5173/
The UI will appear like this:

<img width="1320" height="558" alt="ChaibookLM and 37 more pages - Personal - Microsoft​ Edge 26-07-2026 23_14_36" src="https://github.com/user-attachments/assets/c2761511-259b-404b-8d4e-4d9310731d0e" />

## Structure

```
src/App.jsx   Main jsx file where all other components and services are called.
src/hooks/    For fonts and PDF editing. 
src/services/ Involves services related to embedding, chunking, CRUD operations on notebook and ingesting.
src/components/ UI related components
```
