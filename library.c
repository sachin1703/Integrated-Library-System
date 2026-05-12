#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Book {
    int id;
    char name[50];
    char author[50];
    int qty;
    struct Book* next;
};

struct Book* head = NULL;

// Add Book
void addBook() {
    struct Book* newBook = (struct Book*)malloc(sizeof(struct Book));

    printf("Enter Book ID: ");
    scanf("%d", &newBook->id);

    printf("Enter Book Name: ");
    scanf("%s", newBook->name);

    printf("Enter Author: ");
    scanf("%s", newBook->author);

    printf("Enter Quantity: ");
    scanf("%d", &newBook->qty);

    newBook->next = head;
    head = newBook;

    printf("Book Added Successfully\n");
}

// Display Books
void displayBooks() {
    struct Book* temp = head;

    while (temp != NULL) {
        printf("\nID: %d", temp->id);
        printf("\nName: %s", temp->name);
        printf("\nAuthor: %s", temp->author);
        printf("\nQuantity: %d\n", temp->qty);

        temp = temp->next;
    }
}

// Search Book
void searchBook() {
    int id;
    printf("Enter Book ID: ");
    scanf("%d", &id);

    struct Book* temp = head;

    while (temp != NULL) {
        if (temp->id == id) {
            printf("Book Found: %s\n", temp->name);
            return;
        }
        temp = temp->next;
    }

    printf("Book Not Found\n");
}

int main() {
    int choice;

    while (1) {
        printf("\n1.Add Book\n2.Display\n3.Search\n4.Exit\n");
        scanf("%d", &choice);

        switch (choice) {
            case 1: addBook(); break;
            case 2: displayBooks(); break;
            case 3: searchBook(); break;
            case 4: exit(0);
        }
    }
}