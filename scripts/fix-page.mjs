import { readFileSync, writeFileSync } from "fs"

const filePath = "/vercel/share/v0-project/app/page.tsx"
let content = readFileSync(filePath, "utf-8")

// Eliminar el duplicado ")}\n)\n}" del final
content = content.replace(/\n\)\n\}\s*$/, "\n")

writeFileSync(filePath, content, "utf-8")
console.log("Archivo corregido. Últimas líneas:")
console.log(content.slice(-100))
