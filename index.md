---
layout: default
---

<div class="home">

  <h1 class="page-heading">Posts</h1>

  <ul class="post-list">
    {% for post in site.posts %}
      <li>
        <span class="post-meta">{{ post.date | date: "%b %-d, %Y" }}</span>

        <h2>
          <a class="post-link" href="{{ post.url | prepend: site.baseurl }}">{{ post.title }}</a>
        </h2>
        <div class="post-meta">
        {{ post.excerpt }}
        <a href="{{ site.baseurl }}{{ post.url }}">Read more</a>
        </div>
      </li>
    {% endfor %}
  </ul>
</div>
