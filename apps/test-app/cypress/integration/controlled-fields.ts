describe("Controlled fields", () => {
  it("should store the value and submit it correctly", () => {
    cy.visit("/controlled-field");

    cy.findByTestId("green").should("have.text", "Green (selected)");
    cy.findByTestId("blue")
      .should("have.text", "Blue")
      .click()
      .should("have.text", "Blue (selected)");
    cy.findByTestId("green").should("have.text", "Green");

    cy.findByText("Submit").click();
    cy.findByText("Color chosen is blue").should("exist");
  });

  it("should handle duplicate fields the way they would normally work and reset when field is removed", () => {
    cy.visit("/controlled-field");

    cy.findByTestId("blue").click().should("have.text", "Blue (selected)");

    cy.findByText("+").click();
    cy.findAllByTestId("blue").should("have.length", 2);

    cy.findByText("Blue (selected)").should("exist");
    cy.findByText("Green (selected)").should("exist");

    cy.findByText("-").click();
    cy.findByTestId("blue").should("have.text", "Blue (selected)");

    cy.findByText("-").click();
    cy.findByText("+").click();
    cy.findByTestId("blue").should("have.text", "Blue");
    cy.findByTestId("green").should("have.text", "Green (selected)");
  });

  it("should show validation errors", () => {
    cy.visit("/controlled-field");
    cy.findByText("Submit").click();
    cy.findByTestId("error").should("exist");
  });
});
