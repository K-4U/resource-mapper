<script setup lang="ts">
import { Authenticator} from "@aws-amplify/ui-vue";
</script>

<template>
  <Authenticator>
    <main>
      <h1>Hello {user?.username}</h1>
      <button onClick={signOut}>Sign out</button>
    </main>
  </Authenticator>
</template>

<style scoped>

</style>