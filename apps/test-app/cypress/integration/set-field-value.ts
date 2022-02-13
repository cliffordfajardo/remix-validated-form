describe("setFieldValue", () => {
  it("should correctly set the value of a variety of different input types", () => {
    cy.visit("/set-value");
    cy.findByText("Set values").click();
    cy.findByTestId("text-field").should("have.value", "new value");
    cy.findByTestId("controlled").should("have.value", "some value");
    cy.findByTestId("single-checkbox").should("be.checked");
    cy.findByTestId("checkbox-value1").should("be.checked");
    cy.findByTestId("checkbox-value2").should("be.checked");
    cy.findByTestId("checkbox-value3").should("not.be.checked");
    cy.findByTestId("radio-value2").should("be.checked");
    cy.findByTestId("weird-checkbox").should("not.be.checked");
    cy.findByTestId("weird-radio-one").should("be.checked");
    cy.findByTestId("weird-radio-two").should("not.be.checked");
    cy.findByTestId("weird-text").should("have.value", "two");
    cy.findByTestId("option1").should("be.checked");
    cy.findByTestId("option2").should("not.be.checked");
    cy.findByTestId("option3").should("be.checked");
  });
});
