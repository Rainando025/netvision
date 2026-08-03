const fs = require('fs');
let content = fs.readFileSync('src/components/Diagram3D.tsx', 'utf8');

// The bad section: after pulse.mesh.visible = true; there's gltf code mixed in
// We need to:
// 1. Close the forEach loop properly
// 2. Close the tick function  
// 3. Add requestAnimationFrame, resize handler, cleanup
// 4. Close the main useEffect
// 5. Add exportGLTF function
// 6. Add loadCustomModelAsync properly

const badSection = `           pulse.mesh.visible = true;\n        }\n        const gltf = await new GLTFLoader().loadAsync(url);\r\n        modelGroup.add(gltf.scene);\r\n      } else {\r\n        modelGroup.add(await new OBJLoader().loadAsync(url));\r\n      }\r\n      const box = new THREE.Box3().setFromObject(modelGroup);\r\n      const size = new THREE.Vector3();\r\n      box.getSize(size);\r\n      const maxDim = Math.max(size.x, size.y, size.z);\r\n      if (maxDim > 0) {\r\n        const targetScale = kind === "switch" ? 4.5 / maxDim : 1.2 / maxDim;\r\n        modelGroup.scale.setScalar(targetScale);\r\n        const center = new THREE.Vector3();\r\n        box.getCenter(center);\r\n        modelGroup.position.sub(center.multiplyScalar(targetScale));\r\n      }\r\n      customModelRegistry.set(url, modelGroup);\r\n      loadingUrlsRef.current.delete(url);\r\n      setSceneVersion((v) => v + 1);\r\n      toast.success("Modelo 3D carregado com sucesso!");\r\n    } catch (e) {\r\n      loadingUrlsRef.current.delete(url);\r\n      toast.error("Erro ao carregar modelo 3D.");\r\n    }\r\n  };`;

const goodSection = `           pulse.mesh.visible = true;
        }
      });

      doorAnimRef.current.forEach((anim, rackId) => {
        const pivot = doorPivotsRef.current.get(rackId);
        if (!pivot) return;
        const diff = anim.target - anim.current;
        if (Math.abs(diff) > 0.001) {
          anim.current += diff * Math.min(dt * 5, 1);
          pivot.rotation.y = anim.current;
        }
      });

      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      const newAspect = w / h;
      const frustumSize = 40;
      (camera as THREE.OrthographicCamera).left = (frustumSize * newAspect) / -2;
      (camera as THREE.OrthographicCamera).right = (frustumSize * newAspect) / 2;
      (camera as THREE.OrthographicCamera).top = frustumSize / 2;
      (camera as THREE.OrthographicCamera).bottom = frustumSize / -2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      if (renderer?.domElement) {
        renderer.domElement.removeEventListener("pointerdown", handleMouseDown as EventListener, true);
        renderer.domElement.removeEventListener("pointermove", handleMouseMove as EventListener, true);
        renderer.domElement.removeEventListener("pointerup", handleMouseUp as EventListener, true);
        renderer.domElement.removeEventListener("pointercancel", handleMouseUp as EventListener, true);
        renderer.domElement.removeEventListener("wheel", handleWheel as EventListener);
        renderer.dispose();
      }
    };
  }, []);

  const exportGLTF = (asBinary = true) => {
    try {
      const exporter = new GLTFExporter();
      const objectToExport = selectedNode ? threeNodesRef.current.get(selectedNode.id) || sceneRef.current : sceneRef.current;
      if (!objectToExport) { toast.error('Nada para exportar'); return; }
      (exporter as any).parse(
        objectToExport,
        (result: any) => {
          let output: Blob;
          if (asBinary && result instanceof ArrayBuffer) {
            output = new Blob([result], { type: 'application/octet-stream' });
          } else {
            const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            output = new Blob([text], { type: 'application/json' });
          }
          const url = URL.createObjectURL(output);
          const a = document.createElement('a');
          a.href = url;
          const name = selectedNode ? \`\${(selectedNode.data.name as string) || 'model'}-selected.glb\` : \`scene-\${Date.now()}.glb\`;
          a.download = name;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Exportação concluída.');
        },
        (error: any) => console.error('GLTF export error:', error),
        { binary: asBinary }
      );
    } catch (err) {
      console.error(err);
      toast.error('Erro ao exportar');
    }
  };

  const loadCustomModelAsync = async (nodeId: string, url: string, fileName: string, kind: "switch" | "camera" | "rack", ports = 8) => {
    try {
      const isGlTF = fileName.toLowerCase().endsWith(".gltf") || fileName.toLowerCase().endsWith(".glb");
      let modelGroup = new THREE.Group();
      if (isGlTF) {
        const gltf = await new GLTFLoader().loadAsync(url);
        modelGroup.add(gltf.scene);
      } else {
        modelGroup.add(await new OBJLoader().loadAsync(url));
      }
      const box = new THREE.Box3().setFromObject(modelGroup);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const targetScale = kind === "switch" ? 4.5 / maxDim : 1.2 / maxDim;
        modelGroup.scale.setScalar(targetScale);
        const center = new THREE.Vector3();
        box.getCenter(center);
        modelGroup.position.sub(center.multiplyScalar(targetScale));
      }
      customModelRegistry.set(url, modelGroup);
      loadingUrlsRef.current.delete(url);
      setSceneVersion((v) => v + 1);
      toast.success("Modelo 3D carregado com sucesso!");
    } catch (e) {
      loadingUrlsRef.current.delete(url);
      toast.error("Erro ao carregar modelo 3D.");
    }
  };`;

if (content.includes(badSection)) {
  content = content.replace(badSection, goodSection);
  console.log('Fixed the corrupted section!');
} else {
  console.log('Exact match not found. Trying to locate the issue...');
  // Find the pulse visible line
  const idx = content.indexOf('pulse.mesh.visible = true;\n        }\n        const gltf');
  if (idx >= 0) {
    console.log('Found corrupted section at char index:', idx);
  } else {
    console.log('Not found. Let me check what is after pulse.mesh.visible = true');
    const pulseIdx = content.indexOf('pulse.mesh.visible = true;');
    if (pulseIdx >= 0) {
      console.log('After visible:', JSON.stringify(content.substring(pulseIdx, pulseIdx + 200)));
    }
  }
}

fs.writeFileSync('src/components/Diagram3D.tsx', content);
console.log('Done. Lines:', content.split('\n').length);
