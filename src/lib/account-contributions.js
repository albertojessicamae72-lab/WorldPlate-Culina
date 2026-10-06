export function accountContributions(recipes, accountId) {
  if (!accountId) return [];
  const isCollaborator = (credits) => (credits || []).some((credit) =>
    (typeof credit === "string" ? credit : credit?.id) === accountId);
  const items = [];
  for (const recipe of recipes) {
    if (recipe.owner === accountId || isCollaborator(recipe.collaborators)) {
      items.push({ kind: "recipe", title: recipe.name, href: `/recipes/${recipe.id}`, country: recipe.country });
    }
    for (const adaptation of recipe.adaptations || []) {
      if (adaptation.owner === accountId || isCollaborator(adaptation.collaborators)) {
        items.push({ kind: "adaptation", title: adaptation.title, parent: recipe.name,
          href: `/recipes/${recipe.id}/adapt/${adaptation.destinationCountry}`, country: adaptation.destinationCountry });
      }
    }
  }
  return items;
}
