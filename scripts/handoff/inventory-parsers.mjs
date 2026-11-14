import ts from 'typescript';

/** Static handoff inventory helpers; never execute application route code. */
export function parseRouteInventory(routesSource, manifestSource) {
  const elements = new Map();
  const routes = [];
  let pricingFlag = false;
  const routeFile = ts.createSourceFile('routes.tsx', routesSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const manifestFile = ts.createSourceFile('routeManifest.ts', manifestSource, ts.ScriptTarget.Latest, true);

  function visitElements(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(routeFile) === 'ROUTE_ELEMENTS' &&
        node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      for (const property of node.initializer.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const path = property.name.text;
        let element = property.initializer;
        if (ts.isCallExpression(element)) element = element.arguments[0];
        if (element && (ts.isJsxSelfClosingElement(element) || ts.isJsxElement(element))) {
          const tag = ts.isJsxElement(element) ? element.openingElement.tagName : element.tagName;
          elements.set(path, tag.getText(routeFile));
        }
      }
    }
    ts.forEachChild(node, visitElements);
  }

  function visitManifest(node) {
    if (ts.isIfStatement(node) && node.expression.getText(manifestFile) === 'PRICING_PAGE_ENABLED') {
      pricingFlag = true;
    }
    if (ts.isObjectLiteralExpression(node)) {
      const fields = {};
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)) {
          fields[property.name.text] = property.initializer.text;
        }
      }
      if (fields.path && fields.name && ['public', 'private'].includes(fields.access)) {
        const component = elements.get(fields.path);
        if (!component) throw new Error(`Missing route element for manifest path: ${fields.path}`);
        routes.push({ path: fields.path, name: fields.name, access: fields.access, component });
      }
    }
    ts.forEachChild(node, visitManifest);
  }

  visitElements(routeFile);
  visitManifest(manifestFile);
  if (!routes.length) throw new Error('No route manifest entries found.');
  return { routes, pricingFlag };
}

export function isApiHandlerFile(file) {
  return file.endsWith('.ts') && !/\.(?:test|spec|d)\.ts$/.test(file) &&
    !file.split('/').some((part) => part.startsWith('_'));
}
