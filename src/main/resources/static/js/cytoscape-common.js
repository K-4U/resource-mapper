/* Common cytoscape.js configuration and styles */

// Common cytoscape stylesheet - labels at top-center (cytoscape limitation)
const cytoscapeStyles = [
    // Group container styles
    {
        selector: 'node.group',
        style: {
            'background-color': 'rgba(227, 242, 253, 0.4)',
            'border-width': 3,
            'border-color': '#1976d2',
            'shape': 'roundrectangle',
            'label': 'data(label)',
            'compound-sizing-wrt-labels': 'exclude',
            'text-valign': 'top',
            'text-halign': 'center',
            'text-margin-x': 0,
            'text-margin-y': -10,
            'font-size': 15,
            'font-weight': 'bold',
            'color': '#ffffff',
            'text-background-color': '#1976d2',
            'text-background-opacity': 1,
            'text-background-shape': 'round-rectangle',
            'text-background-padding': '10px 20px',
            'text-shadow-color': '#000000',
            'text-shadow-opacity': 0.3,
            'text-shadow-offset-x': 0,
            'text-shadow-offset-y': 1,
            'text-shadow-blur': 3,
            'padding': 40,
            'min-width': 300,
            'min-height': 200
        }
    },
    // External group container styles
    {
        selector: 'node.external-group',
        style: {
            'background-color': 'rgba(255, 249, 196, 0.4)',
            'border-width': 3,
            'border-color': '#f57c00',
            'shape': 'roundrectangle',
            'label': 'data(label)',
            'compound-sizing-wrt-labels': 'exclude',
            'text-valign': 'top',
            'text-halign': 'center',
            'text-margin-x': 0,
            'text-margin-y': -10,
            'font-size': 14,
            'font-weight': 'bold',
            'color': '#ffffff',
            'text-background-color': '#f57c00',
            'text-background-opacity': 1,
            'text-background-shape': 'round-rectangle',
            'text-background-padding': '8px 16px',
            'text-shadow-color': '#000000',
            'text-shadow-opacity': 0.3,
            'text-shadow-offset-x': 0,
            'text-shadow-offset-y': 1,
            'text-shadow-blur': 3,
            'padding': 30,
            'min-width': 200,
            'min-height': 150
        }
    },
    // Internal service styles
    {
        selector: 'node.service',
        style: {
            'background-color': '#c8e6c9',
            'border-width': 2,
            'border-color': '#388e3c',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 14,
            'font-weight': '600',
            'color': '#1b5e20',
            'width': 100,
            'height': 60,
            'shape': 'roundrectangle',
            'text-wrap': 'wrap',
            'text-max-width': 90
        }
    },
    // External service styles
    {
        selector: 'node.external-service',
        style: {
            'background-color': '#fff9c4',
            'border-width': 2,
            'border-color': '#f57c00',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 12,
            'font-weight': '600',
            'color': '#e65100',
            'width': 90,
            'height': 50,
            'shape': 'roundrectangle',
            'text-wrap': 'wrap',
            'text-max-width': 80
        }
    },
    // Group node styles (for index page)
    {
        selector: 'node.group-node',
        style: {
            'background-color': '#e3f2fd',
            'border-width': 2,
            'border-color': '#1976d2',
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': 16,
            'font-weight': 'bold',
            'color': '#1565c0',
            'width': 120,
            'height': 80,
            'shape': 'roundrectangle'
        }
    },
    // Edge styles
    {
        selector: 'edge',
        style: {
            'width': 2,
            'line-color': '#666',
            'target-arrow-color': '#666',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': 10,
            'font-weight': '600',
            'text-rotation': 'autorotate',
            'text-margin-y': -10,
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.9,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'color': '#424242'
        }
    },
    // Edge hover/selected
    {
        selector: 'edge:selected',
        style: {
            'line-color': '#1976d2',
            'target-arrow-color': '#1976d2',
            'width': 3
        }
    },
    // Service hover effects
    {
        selector: 'node.service:active',
        style: {
            'background-color': '#a5d6a7',
            'border-color': '#2e7d32',
            'border-width': 3
        }
    },
    {
        selector: 'node.external-service:active',
        style: {
            'background-color': '#ffe082',
            'border-color': '#e65100',
            'border-width': 3
        }
    },
    {
        selector: 'node.group-node:active',
        style: {
            'background-color': '#bbdefb',
            'border-color': '#0d47a1',
            'border-width': 3
        }
    }
];

// Layout for index page - simple grid-like vertical layout
const indexLayout = {
    name: 'cose',
    animate: true,
    animationDuration: 500,
    fit: true,
    padding: 80,
    nodeRepulsion: 12000,
    idealEdgeLength: 150,
    gravity: 2,
    numIter: 1000
};

// Layout for group page - better compound node layout
const groupLayout = {
    name: 'cose',
    animate: true,
    animationDuration: 1000,
    fit: true,
    padding: 100,
    componentSpacing: 200,
    nodeOverlap: 40,
    nodeRepulsion: 15000,
    idealEdgeLength: 120,
    edgeElasticity: 100,
    nestingFactor: 0.2,  // Important for compound nodes
    gravity: 1.5,
    numIter: 2000
};

// Create a cytoscape instance
function createCytoscape(containerId, elements, useGroupLayout = false) {
    return cytoscape({
        container: document.getElementById(containerId),
        elements: elements,
        style: cytoscapeStyles,
        layout: useGroupLayout ? groupLayout : indexLayout,
        minZoom: 0.3,
        maxZoom: 2,
        wheelSensitivity: 0.2
    });
}

