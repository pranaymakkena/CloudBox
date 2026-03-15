package com.cloudbox.repository;

import com.cloudbox.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/*
 Handles database operations
*/

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

}