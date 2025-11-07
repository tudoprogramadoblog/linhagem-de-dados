import React, { useMemo, useState, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import "./App.css";

// Dimensões dos nós de tabela
const nodeWidth = 220;
const nodeHeight = 120;

/* =========================
   COMPONENTE DE TABELA (AJUSTADO PARA USAR data.color no background)
   ========================= */
const TableNode = ({ data }) => {
  const [showAttrs, setShowAttrs] = useState(false); 

  if (!data || !data.label) {
    return <div>Erro: Dados da tabela ausentes.</div>;
  }

  // ⭐️ 1. Obter a cor para o fundo da tabela ⭐️
  const backgroundColor = data.color || "#ffffff";
  
  // 2. Usar uma borda padrão para manter o foco no fundo
  const borderColor = "#aaa";

  return (
    <div
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        padding: 8,
        background: backgroundColor, // ⭐️ A cor da seção é aplicada no fundo ⭐️
        boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
        width: nodeWidth, 
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          cursor: "pointer",
          marginBottom: 4,
          // Fundo semi-transparente para o rótulo garantir legibilidade em cores claras
          background: "rgba(255, 255, 255, 0.7)", 
          padding: "4px 8px",
          borderRadius: 4,
        }}
        onClick={() => setShowAttrs((prev) => !prev)}
      >
        {data.label} {showAttrs ? "▲" : "▼"}
      </div>

      {showAttrs && data.attributes && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {data.attributes.map((attr, i) => (
            <li key={i}>
              {attr.pk && <span title="Primary Key">🔑 </span>}
              {attr.fk && <span title="Foreign Key">🔗 </span>}
              {attr.name}
            </li>
          ))}
        </ul>
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

/* =========================
   FUNÇÃO DE LAYOUT (DAGRE) (Permanece igual)
   ========================= */
const getLayoutedElements = (nodes, edges, direction = "LR") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === "LR";
  
  dagreGraph.setGraph({ 
    rankdir: direction,
    ranksep: 150, 
    nodesep: 80   
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      id: node.id,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
    };
  });
};

/* =========================
   APP PRINCIPAL
   ========================= */
function App() {
  const [data, setData] = useState(null);

  // ⭐️ LÓGICA DE CARREGAMENTO AJUSTADA PARA INJETAR A COR ⭐️
  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((json) => {
        // 1. Cria um mapa de cores (id da seção -> cor)
        const colorMap = json.sections.reduce((acc, s) => {
            acc[s.id] = s.color;
            return acc;
        }, {});

        // 2. Processa tabelas, injetando a cor na propriedade 'data'
        const processedTables = json.tables.map(t => ({
            ...t,
            data: { 
                label: t.label, 
                attributes: t.attributes,
                color: colorMap[t.section] // ⭐️ Cor da seção injetada aqui
            }
        }));
        
        setData({...json, tables: processedTables});
      })
      .catch((err) => console.error("Erro ao carregar JSON:", err));
  }, []);

  const tables = data?.tables || [];
  const edges = data?.edges || [];

  const layoutedTables = useMemo(() => {
    if (tables.length === 0) return [];
    
    const layoutedPositions = getLayoutedElements(tables, edges);
    
    return layoutedPositions.map((layoutedNode) => {
      const originalTable = tables.find(t => t.id === layoutedNode.id);
      
      if (!originalTable) return null; 

      return {
        ...originalTable, 
        type: "tableNode", 
        position: layoutedNode.position,
        targetPosition: layoutedNode.targetPosition,
        sourcePosition: layoutedNode.sourcePosition,
      };
    }).filter(Boolean); 
  }, [tables, edges]);

  const allNodes = layoutedTables;

  const nodeTypes = useMemo(
    () => ({
      tableNode: TableNode,
    }),
    []
  );

  const flowEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        animated: true,
        style: { stroke: "#555" },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: "#fff", color: "#333", fillOpacity: 0.8 },
      })),
    [edges]
  );

  if (!data) {
    return <div style={{ padding: 20 }}>Carregando dados...</div>;
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactFlow nodes={allNodes} edges={flowEdges} nodeTypes={nodeTypes} fitView>
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

export default App;