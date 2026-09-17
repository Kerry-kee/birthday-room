import * as THREE from 'three';

// Keep original meshes for hit testing; render their static colored surfaces in one batch.
export function batchSurfaces(parent,excluded,gradientMap){
  parent.updateWorldMatrix(true,true);
  const inverse=parent.matrixWorld.clone().invert(),pieces=[];
  parent.traverse(mesh=>{
    if(!mesh.isMesh||mesh.userData.minitoolBatch||!mesh.layers.isEnabled(0)||!mesh.material.isMeshToonMaterial||mesh.material.transparent||mesh.material.map)return;
    let ancestor=mesh;while(ancestor&&ancestor!==parent){if(excluded.has(ancestor))return;ancestor=ancestor.parent;}
    const geometry=(mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone());
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));
    const positions=geometry.getAttribute('position').array,normals=geometry.getAttribute('normal').array;
    pieces.push({positions,normals,color:mesh.material.color});mesh.layers.set(1);geometry.dispose();
  });
  if(!pieces.length)return;
  const length=pieces.reduce((n,p)=>n+p.positions.length,0),positions=new Float32Array(length),normals=new Float32Array(length),colors=new Float32Array(length);let offset=0;
  pieces.forEach(piece=>{positions.set(piece.positions,offset);normals.set(piece.normals,offset);for(let i=0;i<piece.positions.length;i+=3){colors[offset+i]=piece.color.r;colors[offset+i+1]=piece.color.g;colors[offset+i+2]=piece.color.b;}offset+=piece.positions.length;});
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeBoundingSphere();
  const batch=new THREE.Mesh(geometry,new THREE.MeshToonMaterial({vertexColors:true,gradientMap}));batch.userData.minitoolBatch=true;parent.add(batch);
}
