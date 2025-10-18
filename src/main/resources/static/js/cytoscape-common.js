/* Common cytoscape.js configuration and styles */

// Common cytoscape stylesheet
const cytoscapeStyles = [
    // Group container styles - Modern blue tab design
    {
        selector: 'node.group',
        style: {
            'background-color': 'rgba(227, 242, 253, 0.4)',
            'border-width': 3,
            'border-color': '#1976d2',
            'shape': 'roundrectangle',
            'label': 'data(label)',
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
            'padding': 30
        }
    },
    // External group container styles - Modern orange tab design
    {
        selector: 'node.external-group',
        style: {
            'background-color': 'rgba(255, 249, 196, 0.4)',
            'border-width': 3,
            'border-color': '#f57c00',
            'shape': 'roundrectangle',
            'label': 'data(label)',
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
            'padding': 25
        }
    },
    // Internal service styles - Clean and modern
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
            'padding': 15,
            'shape': 'roundrectangle',
            'text-wrap': 'wrap',
            'text-max-width': 90,
            'transition-property': 'background-color, border-color',
            'transition-duration': '0.2s'
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
            'padding': 12,
            'shape': 'roundrectangle',
            'text-wrap': 'wrap',
            'text-max-width': 80,
            'transition-property': 'background-color, border-color',
            'transition-duration': '0.2s'
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
            'shape': 'roundrectangle',
            'text-shadow-color': '#ffffff',
            'text-shadow-opacity': 0.5,
            'text-shadow-offset-x': 0,
            'text-shadow-offset-y': 1,
            'text-shadow-blur': 1
        }
    },
    // Edge styles - Clean and readable
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
            'width': 3,
            'label': 'data(label)',
            'color': '#1976d2',
            'font-weight': 'bold'
        }
    },
    // Service hover effects - smooth color transitions
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
    // Group node hover
    {
        selector: 'node.group-node:active',
        style: {
            'background-color': '#bbdefb',
            'border-color': '#0d47a1',
            'border-width': 3
        }
    }
];

// Common cytoscape layout configuration - More vertical arrangement
const cytoscapeLayout = {
    name: 'cose',
    animate: true,
    animationDuration: 500,
    fit: true,
    padding: 80,
    componentSpacing: 150,
    nodeRepulsion: 12000,
    idealEdgeLength: 120,
    edgeElasticity: 100,
    nestingFactor: 0.1,
    gravity: 2,
    numIter: 1500,
    initialTemp: 200,
    coolingFactor: 0.95,
    minTemp: 1.0,
    randomize: false,
    avoidOverlap: true
};

// Create a cytoscape instance with common configuration
function createCytoscape(containerId, elements, layoutOptions = {}) {
    return cytoscape({
        container: document.getElementById(containerId),
        elements: elements,
        style: cytoscapeStyles,
        layout: {
            ...cytoscapeLayout,
            ...layoutOptions
        },
        minZoom: 0.5,
        maxZoom: 2
    });
}

