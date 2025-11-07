import React, { useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import "./App.css";

const TableNode = ({ data }) => {
  const [showAttrs, setShowAttrs] = useState(false);

  return (
    <div className="table-node">
      <div
        className="table-header"
        onClick={() => setShowAttrs((prev) => !prev)}
      >
        {data.label} {showAttrs ? "▲" : "▼"}
      </div>
      {showAttrs && (
        <ul className="attributes-list">
          {data.attributes.map((attr, i) => (
            <li key={i}>{attr}</li>
          ))}
        </ul>
      )}

      {/* Handles para conexão */}
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

// Registrar nosso custom node
const nodeTypes = { tableNode: TableNode };

function App() {
  const nodes = [
    {
      id: "1",
      type: "tableNode",
      data: {
        label: "Tabela Origem",
        attributes: ["id", "nome", "email", "data_criacao"],
      },
      position: { x: 50, y: 100 },
    },
    {
      id: "2",
      type: "tableNode",
      data: {
        label: "Tabela Destino",
        attributes: ["id", "nome", "email"],
      },
      position: { x: 400, y: 100 },
    },
    {
      id: "3",
      type: "tableNode",
      data: {
        label: "Tabela Relatório",
        attributes: ["id", "nome", "total_vendas"],
      },
      position: { x: 750, y: 100 },
    },
  ];

  const edges = [
    { id: "e1-2", source: "1", target: "2", animated: true, label: "transforma" , markerEnd: { type: "arrow", width: 30, height: 30 }},
    { id: "e2-3", source: "2", target: "3", animated: true, label: "agrega" , markerEnd: { type: "arrow", width: 30, height: 30 }},
  ];

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

export default App;
