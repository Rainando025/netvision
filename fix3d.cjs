const fs = require('fs');
let content = fs.readFileSync('src/components/Diagram3D.tsx', 'utf8');

// 1. Lower all high metalness to 0.2
content = content.replace(/metalness:\s*0\.[5-9]\d*/g, 'metalness: 0.2');
content = content.replace(/metalness:\s*1\.*0*/g, 'metalness: 0.2');

// 2. Fix event listeners to use capture phase
content = content.replaceAll('addEventListener("pointerdown", handleMouseDown as EventListener);', 'addEventListener("pointerdown", handleMouseDown as EventListener, true);');
content = content.replaceAll('addEventListener("pointermove", handleMouseMove as EventListener);', 'addEventListener("pointermove", handleMouseMove as EventListener, true);');
content = content.replaceAll('addEventListener("pointerup", handleMouseUp as EventListener);', 'addEventListener("pointerup", handleMouseUp as EventListener, true);');
content = content.replaceAll('addEventListener("pointercancel", handleMouseUp as EventListener);', 'addEventListener("pointercancel", handleMouseUp as EventListener, true);');

content = content.replaceAll('removeEventListener("pointerdown", handleMouseDown as EventListener);', 'removeEventListener("pointerdown", handleMouseDown as EventListener, true);');
content = content.replaceAll('removeEventListener("pointermove", handleMouseMove as EventListener);', 'removeEventListener("pointermove", handleMouseMove as EventListener, true);');
content = content.replaceAll('removeEventListener("pointerup", handleMouseUp as EventListener);', 'removeEventListener("pointerup", handleMouseUp as EventListener, true);');
content = content.replaceAll('removeEventListener("pointercancel", handleMouseUp as EventListener);', 'removeEventListener("pointercancel", handleMouseUp as EventListener, true);');

// 3. Add stopPropagation
content = content.replaceAll('isDragging = true;', 'e.stopPropagation();\n        isDragging = true;');
content = content.replace(
  'if (!isDragging) {',
  'if (isDragging) { e.stopPropagation(); }\n      if (!isDragging) {'
);

fs.writeFileSync('src/components/Diagram3D.tsx', content);
